# -*- coding: utf-8 -*-
"""
celery 任务示例

本地启动celery命令: python  manage.py  celery  worker  --settings=settings
周期性任务还需要启动celery调度命令：python  manage.py  celerybeat --settings=settings
"""
from celery import task
from celery.schedules import crontab
from celery.task import periodic_task
from esb.new_client import get_new_esb_client
from home_application.helper_view import *
from common.log import logger
from esb.client import *
from home_application.module_sync import *
import netaddr
import time
from django.db.models import Count


def send_mail(to, subject, mail_content, content_type="HTML"):
    if not to:
        return
    client = get_esb_client()

    kwargs = {
        "to": to,
        "subject": subject,
        "content": mail_content,
        "content_type": content_type,
    }
    result = client.call("common", "send_email", kwargs)
    if result["result"]:
        logger.error(u"邮件发送成功")
    else:
        logger.error(result["message"])


@task()
def new_send_email(receiver, title, content):
    try:
        logger.error(u"开始发送邮件")
        esb_client = get_new_esb_client()
        result = esb_client.call('cmsi','send_mail', receiver=receiver, title=title, content=content)
        if result["result"]:
            logger.error(u"邮件发送成功")
            return
        else:
            logger.error(u"邮件发送失败")
            logger.error(result["message"])
            return
    except Exception, e:
        logger.exception(e)


# @task()
# def get_one_ip_usage(ips):
#     try:
#         logger.info(u"开始扫描单个IP的使用情况")
#         v_result = one_ip_scan(ips)
#         for u in v_result:
#             IPs.objects.filter(start_ip=u).update(used_num=1, ip_used_list=u)
#         logger.info(u"结果写入成功")
#         return True
#     except Exception, e:
#         logger.error(u"扫描IP使用情况出错；")
#         logger.exception(e)


@task()
def get_ips_usage(ip_obj):
    try:
        logger.info(u"开始扫描网段的使用情况")
        v_result = IPNetScan1(ip_obj.start_ip, ip_obj.end_ip)
        ip_obj.used_num = len(v_result)
        ip_obj.ip_used_list = str(v_result)
        ip_obj.save()
        logger.info(u"结果写入成功")
        return True
    except Exception, e:
        logger.error(u"扫描IP使用情况出错；")
        logger.exception(e)


# @periodic_task(run_every=crontab(minute=0, hour='10,22', day_of_week="*"))
# def auto_update_ip():
#     all_ip = IPs.objects.filter(is_admin=True)
#     for i in all_ip:
#         get_ips_usage(i)
#     return True


# @periodic_task(run_every=crontab(minute="*/15"))
# def auto_update_ip_pool():
#     ip_pool_list = IPPools.objects.all()
#     for i in ip_pool_list:
#         update_ip_used(i)
#     return True


# @task()
# def update_ip_used(ip_pool):
#     ip_list = IPs.objects.filter(ip_pool_id=ip_pool.id)
#     used_count = 0
#     for i in ip_list:
#         start_ip = i.start_ip
#         end_ip = i.end_ip
#         used_count += len(netaddr.IPRange(start_ip, end_ip))
#     ip_pool.used_count = used_count
#     ip_pool.save()



@task()
# IP资源池使用率告警
@periodic_task(run_every=crontab(minute=0, hour=23, day_of_week="*"))
def check_pool_usage():
    pool_obj = IPPools.objects.all()
    pool_warn = float(Settings.objects.get(key="POOL_WARN").value) / 100
    pool_list = []
    for one_obj in pool_obj:
        use_count = IPs.objects.filter(ip_pool=one_obj, is_deleted=False).count()
        pool_usage = float(use_count) / float(one_obj.all_count)
        if pool_usage > pool_warn:
            str = "%s: %s%%" % (one_obj.ip_net, pool_usage * 100)
            pool_list.append(str)
    if pool_list:
        pool_str = "<br />".join(pool_list)
        mail_content = u"亲爱的管理员，以下IP资源池的使用率已超过告警阀值（%s%%）:<br />%s" % (pool_warn * 100, pool_str)
        title = u"IP资源池使用率告警"
        receivers = ",".join([i.mailbox for i in Mailboxes.objects.all()])
        new_send_email(receivers, title, mail_content)


@task()
# 扫描IP的使用情况
def scan_ip_usage(ip_list, cloud_id=0):
    try:
        logger.error(u"开始扫描IP的使用情况")
        v_result = one_ip_scan(ip_list)
        for u in v_result:
            IPs.objects.filter(ip=u, cloud_id=cloud_id, is_deleted=False).update(ip_status="01")
        logger.error(u"成功扫描IP的使用情况")
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.error(u"扫描IP使用情况失败")
        logger.exception(err_msg)


# 定期扫描资源池IP使用情况
@periodic_task(run_every=crontab(minute=0, hour='11,23', day_of_week="*"))
def auto_scan_pool_usage():
    all_pool_obj = IPPools.objects.all()
    logger.error(u"系统开始扫描所有资源池IP的使用情况")
    for pool_obj in all_pool_obj:
        scan_one_pool_usage.delay(pool_obj)
    logger.error(u"系统完成扫描所有资源池IP的使用情况")


# 扫描单个资源池IP使用情况
@task()
def scan_one_pool_usage(pool_obj):
    logger.error(u"开始扫描网段【%s】的IP使用情况" % pool_obj.ip_net)
    # add_ips = []
    try:
        v_result = IPNetScan1(pool_obj.ip_start, pool_obj.ip_end)
        logger.error(u"正在使用的IP：%s" % v_result)
        # now_time = date_now()
        for i in v_result:
            IPs.objects.filter(ip=i, ip_pool=pool_obj).update(ip_status="01")
        # delete_obj = IPs.objects.filter(owner="system", is_apply=False).exclude(ip__in=v_result)
        # delete_ips = [j.ip for j in delete_obj if j.ip not in v_result]
        # if delete_obj:
        #     delete_obj.delete()
        #     one_delete_obj = delete_obj[0]
        #     one_delete_obj.ip = ",".join(delete_ips)
        #     logger.error(u"删除未通过申请流程且未在使用的IP：%s" % one_delete_obj.ip)
        #     log = OperationLog()
        #     log.create_log(one_delete_obj, None, "delete", "system")
        #     del log
        # obj = ""
        # for i in v_result:
        #     obj, result = IPs.objects.update_or_create(ip=i, ip_pool=pool_obj,
        #                                                defaults={
        #                                                 "ip_status": "01"
        #                                                })
        #     if result:
        #         add_ips.append(i)
        #         obj.owner = "system"
        #         obj.created_by = "system"
        #         obj.modified_by = "system"
        #         obj.when_created = now_time
        #         obj.when_modified = now_time
        #         obj.is_apply = False
        #         obj.save()
        # if not obj:
        #     logger.error(u"完成扫描网段【%s】的IP使用情况" % pool_obj.ip_net)
        # else:
        #     obj.ip = ",".join(add_ips)
        #     log = OperationLog()
        #     log.create_log(obj, None, "add", "system")
        #     del log
        #     logger.error(u"完成扫描网段【%s】的IP使用情况" % pool_obj.ip_net)
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.error(u"扫描网段【%s】的IP使用情况失败" % pool_obj.ip_net)
        logger.error(err_msg)


@periodic_task(run_every=crontab(minute=0, hour=0, day_of_week="*"))
# IP即将过期邮件提醒
def ip_will_expire_warn():
    ip_warn_day = int(Settings.objects.get(key="IP_WARN_DAY").value)
    warn_day_later = datetime.datetime.now() + datetime.timedelta(days=ip_warn_day)
    mail_list = IPs.objects.filter(is_keep=False, is_expired=False, is_deleted=False).exclude(when_expired="").values('owner_mail').annotate(mail_count=Count('owner_mail'))
    for i in mail_list:
        user_ip_obj = IPs.objects.filter(owner_mail=i["owner_mail"], is_keep=False, is_expired=False,
                                         is_deleted=False).exclude(when_expired="")
        user_ip_list = []
        for j in user_ip_obj:
            expire_day = datetime.datetime.strptime(str(j.when_expired), '%Y-%m-%d')
            time_diff = expire_day - warn_day_later
            if time_diff.days < 0:
                ip_str = "%s [%s]" % (j.ip, j.when_expired)
                user_ip_list.append(ip_str)
        if user_ip_list:
            receivers = i["owner_mail"]
            title = u"IP即将过期通知"
            content_str = "<br />".join(user_ip_list)
            mail_content = u"亲爱的管理员，你所申请的以下IP即将在%s天内过期：<br />%s" % (ip_warn_day, content_str)
            new_send_email.delay(receivers, title, mail_content)


@periodic_task(run_every=crontab(minute=0, hour=1, day_of_week="*"))
# 对已过期的IP进行处理，转换为释放状态
def scan_ip_expire():
    now_time = datetime.datetime.now()
    mail_list = IPs.objects.filter(is_keep=False, is_deleted=False).exclude(when_expired="").exclude(ip_status="02").values(
        'owner_mail').annotate(mail_count=Count('owner_mail'))
    for i in mail_list:
        user_ip_obj = IPs.objects.filter(is_keep=False, owner_mail=i["owner_mail"], is_deleted=False).exclude(
            when_expired="").exclude(ip_status="02")
        user_ip_list = []
        for j in user_ip_obj:
            expire_day = datetime.datetime.strptime(str(j.when_expired), '%Y-%m-%d')
            time_diff = expire_day - now_time
            if time_diff.days < 0:
                ip_str = "%s [%s]" % (j.ip, j.when_expired)
                user_ip_list.append(ip_str)
                j.is_expired = True
                j.ip_status = "02"
                j.save()
                # log = OperationLog()
                # log.create_log(j, None, "delete", "system")
                # del log
        if user_ip_list:
            receivers = i["owner_mail"]
            title = u"IP过期通知"
            content_str = "<br />".join(user_ip_list)
            mail_content = u"亲爱的管理员，你所申请的以下IP已过期，已被系统回收：<br />%s" % content_str
            new_send_email.delay(receivers, title, mail_content)


# IP地址回收，
@periodic_task(run_every=crontab(minute=0, hour=2, day_of_week="*"))
def scan_ip_recycle():
    ip_recycle_day = int(Settings.objects.get(key="RECYCLE_DAY").value)
    now_time = datetime.datetime.now()
    ip_recycle_obj = IPs.objects.filter(is_keep=False, is_deleted=False, is_expired=True).exclude(when_expired="")
    ip_recycle_list = []
    for i in ip_recycle_obj:
        expire_day = datetime.datetime.strptime(str(i.when_expired), '%Y-%m-%d')
        recycle_day = expire_day + datetime.timedelta(days=ip_recycle_day)
        time_diff = recycle_day - now_time
        if time_diff.days < 0:
            i.is_deleted = True
            i.save()
            ip_str = "%s [%s]" % (i.ip, i.when_expired)
            ip_recycle_list.append(ip_str)
    logger.error(u"以下IP已超过预留天数，系统自定回收并加入空闲池：%s" % ip_recycle_list)
    # 邮件通知管理员
    if ip_recycle_list:
        mails = Mailboxes.objects.all().values('mailbox')
        to = []
        for i in mails:
            if i['mailbox'] not in to:
                to.append(i['mailbox'])
        receivers = ",".join(to)
        title = u"IP地址回收通知"
        content_str = "<br />".join(ip_recycle_list)
        mail_content = u"亲爱的管理员，以下过期的IP预留已超过%s天，系统已自动回收并加入空闲池：<br />%s" % (ip_recycle_day, content_str)
        new_send_email.delay(receivers, title, mail_content)


@task()
# 同步单个模型IP
def sync_one_module_ip(module_obj, username, ip_attrs, new_sync_log=None):
    logger.error(u"CMDB模型【%s】开始同步" % module_obj['bk_obj_name'])
    try:
        task_name = '手动任务_{}'.format(timezone.now().strftime("%Y%m%d%H%M%S"))
        if not new_sync_log:
            new_sync_log = SyncLog.objects.create(name=task_name, model_name=module_obj['bk_obj_name'],
                                                  created_by=username, status='RUNNING')
        model_maps = [{'model_item': i.model_item, 'ip_item': i.ip_item}
                         for i in ModelMap.objects.filter(module_id=module_obj['module_id'])]

        v_result = SyncModule_IP(module_obj['bk_obj_id'], model_maps, ip_attrs, username)
        if v_result['result']:
            # ['data': {'update_list': self.update_list, 'add_ips': self.ip_list, 'no_sync_ips': self.no_pool_ips}
            # 'result': true]
            # 新增IP
            add_ips = v_result['data']['add_ips']
            add_models = [SyncDetail(log_id=new_sync_log.id, ip=i, type='add', model_name=module_obj['bk_obj_name'])
                          for i in add_ips]
            SyncDetail.objects.bulk_create(add_models)
            # 冲突处理
            update_ips = v_result['data']['update_list']
            update_models = [SyncDetail(log_id=new_sync_log.id, ip=i, type='modify',
                                        model_name=module_obj['bk_obj_name']) for i in update_ips]
            SyncDetail.objects.bulk_create(update_models)
        now_time = date_now()
        new_sync_log.end_time = now_time
        new_sync_log.status = 'COMPLETE'
        new_sync_log.save()
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.error(u"CMDB模型【%s】同步失败" % module_obj['bk_obj_name'])
        logger.error(err_msg)


# 周期同步多个模型（按优先级）
@periodic_task(run_every=crontab(minute=0, hour=3, day_of_week="*"))
def sync_modules_ip():
    logger.error(u'CMDB模型全量同步开始：')
    try:
        module_list = CmdbModel.objects.order_by('level')
        ip_attrs = [{'ip_attr_id': i.id, 'name': i.name} for i in IPAttr.objects.filter(attr_type='ip')]
        username = 'admin'
        module_names = ','.join([i.model_name for i in module_list])
        task_name = '周期任务_{}'.format(timezone.now().strftime("%Y%m%d%H%M%S"))
        new_sync_log = SyncLog.objects.create(name=task_name, model_name=module_names,
                                              created_by=username, status='RUNNING')
        for module_obj in module_list:
            logger.error(u"CMDB模型【%s】开始同步" % module_obj.model_name)
            model_maps = [{'model_item': i.model_item, 'ip_item': i.ip_item}
                      for i in ModelMap.objects.filter(module_id=module_obj.id)]
            v_result = SyncModule_IP(module_obj.model_id, model_maps, ip_attrs, username)
            if v_result['result']:
                # ['data': {'update_list': self.update_list, 'add_ips': self.ip_list, 'no_sync_ips': self.no_pool_ips}
                # 'result': true]
                # 新增IP
                add_ips = v_result['data']['add_ips']
                add_models = [SyncDetail(log_id=new_sync_log.id, ip=i, type='add', model_name=module_obj.model_name)
                              for i in add_ips]
                SyncDetail.objects.bulk_create(add_models)
                # 冲突处理
                update_ips = v_result['data']['update_list']
                update_models = [SyncDetail(log_id=new_sync_log.id, ip=i, type='modify',
                                            model_name=module_obj.model_name) for i in update_ips]
                SyncDetail.objects.bulk_create(update_models)
        now_time = date_now()
        new_sync_log.end_time = now_time
        new_sync_log.status = 'COMPLETE'
        new_sync_log.save()
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.error(u'CMDB模型全量同步失败')
        logger.error(err_msg)
        
