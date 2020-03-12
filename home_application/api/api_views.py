# -*- coding: utf-8 -*-

from django.http import HttpResponse
import json
from account.decorators import login_exempt
from django.views.decorators.csrf import csrf_exempt
from home_application.models import *
from IPy import IP
from common.log import logger
import netaddr
from home_application.helper_view import verify_ip_free_status, date_now
from conf.default import BK_PAAS_HOST, SITE_URL
from home_application.celery_tasks import new_send_email
from home_application.ip_pool_view import get_is_ip_overlaps


def render_cross_domain_json(data={}):
    rp = HttpResponse(json.dumps(data))
    rp['Access-Control-Allow-Origin'] = '*'
    rp['Access-Control-Allow-Methods'] = 'GET, POST'
    rp['Access-Control-Allow-Headers'] = 'appid,csrfkey,x-requested-with,content-type'
    return rp


# 创建资源池
@login_exempt
@csrf_exempt
def add_net_pool(request):
    try:
        # 获取数据
        net_pool = request.GET["net_pool"]
        pool_name = request.GET.get("net_mask", net_pool)
        net_mask = request.GET.get("net_mask", "")
        gate_way = request.GET.get("gate_way", "")
        dns = request.GET.get("dns", "")
        created_by = request.GET.get("app_name", "API")

        # 判断网段是否存在重复
        ips = IP(net_pool)
        if get_is_ip_overlaps(net_pool):
            return render_cross_domain_json({"result": False, "data": [u"存在重叠IP"]})

        now_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ip_obj = {
            "title": pool_name, "ip_net": net_pool, "used_count": 0, "all_count": ips.len(),
            "ip_start": str(ips[0]), "ip_end": str(ips[-1]), "gate_way": gate_way, "dns": dns,
            "net_mask": ips.strNetmask(), "created_by": created_by, "when_created": now_time
        }

        # 创建资源池
        ip_pool = IPPools()
        ip_pool.create_item(ip_obj)
        return render_cross_domain_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_cross_domain_json({"result": False})


# 获取IP资源池（网段）
@login_exempt
@csrf_exempt
def get_net_pools(request):
    try:
        pool_obj = IPPools.objects.all()
        return_data = [i.to_dic() for i in pool_obj]
        return render_cross_domain_json({"result": True, "data": return_data})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_cross_domain_json({"result": False})


# 获取网段可用IP
@login_exempt
@csrf_exempt
def get_pool_ips(request):
    try:
        pool_id = request.GET["id"]
        pool_obj = IPPools.objects.get(id=pool_id)
        pool_ips = [str(i) for i in IP(pool_obj.ip_net)]
        pool_ips = pool_ips[1:len(pool_ips)-1]
        use_ips = [i.ip for i in IPs.objects.filter(ip_pool=pool_obj, is_deleted=False)]
        return_data = [i for i in pool_ips if i not in use_ips]
        return render_cross_domain_json({"result": True, "data": return_data})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_cross_domain_json({"result": False})


# IP分配
@login_exempt
@csrf_exempt
def ip_allot(request):
    try:
        pool_id = request.GET["id"]
        ip = request.GET["ip"]
        net_mask = request.GET.get("net_mask", "")
        gate_way = request.GET.get("gate_way", "")
        dns = request.GET.get("dns", "")
        app_name = request.GET.get("app_name", "")
        when_expired = request.GET.get("when_expired", "")
        owner = request.GET.get("owner", "")
        owner_mail = request.GET.get("owner_mail", "")
        username = request.GET.get("username", "")
        now_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        pool_obj = IPPools.objects.get(id=pool_id)
        if not net_mask:
            net_mask = pool_obj.net_mask
        if not gate_way:
            gate_way = pool_obj.gate_way
        if not dns:
            dns = pool_obj.dns
        filter_obj = IPs.objects.filter(ip=ip, ip_pool=pool_obj, is_deleted=False)
        if filter_obj:
            return render_cross_domain_json({"result": False, "data": [u"该IP不可用"]})
        ip_obj = IPs.objects.create(ip=ip, business=app_name, when_expired=when_expired, owner=owner,
                                    owner_mail=owner_mail, created_by=username, modified_by=username,
                                    when_created=now_time, when_modified=now_time, description=app_name,
                                    ip_pool=pool_obj, net_mask=net_mask, gate_way=gate_way, dns=dns)
        log = OperationLog()
        log.create_log(None, ip_obj, "add", app_name)
        del log
        return render_cross_domain_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_cross_domain_json({"result": False})


# 分配IP（主动提供IP）
@login_exempt
@csrf_exempt
def auto_allot_ip(request):
    try:
        pool_id = request.GET["id"]
        app_name = request.GET.get("app_name", "")
        when_expired = request.GET.get("when_expired", "")
        owner = request.GET.get("owner", "")
        owner_mail = request.GET.get("owner_mail", "")
        username = request.GET.get("username", "")
        num = int(request.GET.get("num", 1))
        now_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        pool_obj = IPPools.objects.get(id=pool_id)
        pool_ips = [str(i) for i in IP(pool_obj.ip_net)]
        use_ips = [i.ip for i in IPs.objects.filter(ip_pool=pool_obj, is_deleted=False)]
        unused_ips = [i for i in pool_ips if i not in use_ips]
        if num > len(unused_ips):
            return render_cross_domain_json(
                {"result": False, "data": [u"资源池不足，剩余IP（%s个）" % len(unused_ips)]})
        return_data = unused_ips[0:num]
        ip_obj = ""
        for i in return_data:
            ip_obj = IPs.objects.create(ip=i, business=app_name, when_expired=when_expired, owner=owner,
                                        owner_mail=owner_mail, created_by=username, modified_by=username,
                                        when_created=now_time, when_modified=now_time, description=app_name,
                                        ip_pool=pool_obj, gate_way=pool_obj.gate_way, dns=pool_obj.dns,
                                        net_mask=pool_obj.net_mask)
        if ip_obj:
            ip_str = ",".join(return_data)
            ip_obj.ip = ip_str
            log = OperationLog()
            log.create_log(None, ip_obj, "add", app_name)
            del log
        return render_cross_domain_json({"result": True, "data": return_data})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_cross_domain_json({"result": False})


# IP回收
@login_exempt
@csrf_exempt
def ip_recycle(request):
    try:
        pool_id = request.GET["id"]
        ip = request.GET["ip"]
        app_name = request.GET.get("app_name", "")
        pool_obj = IPPools.objects.get(id=pool_id)
        filter_obj = IPs.objects.filter(ip=ip, ip_pool=pool_obj, is_deleted=False)
        if not filter_obj:
            return render_cross_domain_json({"result": False, "data": [u"该IP不存在"]})
        del_obj = IPs.objects.get(ip=ip, ip_pool=pool_obj, is_deleted=False)
        del_obj.is_deleted = True
        del_obj.save()
        log = OperationLog()
        log.create_log(del_obj, None, "delete", app_name)
        del log
        return render_cross_domain_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_cross_domain_json({"result": False})


# IP续约
@login_exempt
@csrf_exempt
def ip_renewal(request):
    try:
        pool_id = request.GET["id"]
        ip = request.GET["ip"]
        app_name = request.GET.get("app_name", "")
        when_expired = request.GET.get("when_expired", "")
        owner = request.GET.get("owner", "")
        owner_mail = request.GET.get("owner_mail", "")
        username = request.GET.get("username", "")
        now_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        pool_obj = IPPools.objects.get(id=pool_id)
        filter_obj = IPs.objects.filter(ip=ip, ip_pool=pool_obj, is_deleted=False)
        if not filter_obj:
            return render_cross_domain_json({"result": False, "data": [u"该IP不存在"]})
        old_module = IPs.objects.get(ip=ip, ip_pool=pool_obj, is_deleted=False)
        IPs.objects.filter(ip=ip, ip_pool=pool_obj).update(
            business=app_name, when_expired=when_expired, owner=owner, owner_mail=owner_mail, created_by=username,
            modified_by=username, when_created=now_time, when_modified=now_time, description=app_name, is_apply=True)
        new_module = IPs.objects.get(ip=ip, ip_pool=pool_obj, is_deleted=False)
        log = OperationLog()
        log.create_log(old_module, new_module, "update", app_name)
        del log
        return render_cross_domain_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_cross_domain_json({"result": False})


# IP申请
@login_exempt
@csrf_exempt
def ip_apply(request):
    try:
        pool_id = request.GET["id"]
        start_ip = request.GET["start_ip"]
        end_ip = request.GET.get("end_ip", "")
        owner_mail = request.GET.get("owner_mail", "")
        owner = request.GET.get("owner", "")
        app_name = request.GET.get("app_name", "")
        when_expired = request.GET.get("when_expired", "")
        pool_obj = IPPools.objects.filter(id=pool_id)
        if not pool_obj:
            return render_cross_domain_json({"result": False, "data": [u"所申请的网段不在资源池内"]})
        ip_pool_list = IP(pool_obj[0].ip_net)
        if end_ip:
            if start_ip not in ip_pool_list or end_ip not in ip_pool_list:
                return render_cross_domain_json({"result": False, "data": [u"所申请的IP超出网段范围"]})
            ip_type = "01"
            ip_str = start_ip + "~" + end_ip
            ip_list = [str(ip) for ip in netaddr.IPRange(start_ip, end_ip)]
        else:
            ip_list = start_ip.strip(",").split(",")
            for i in ip_list:
                if i not in ip_pool_list:
                    return render_cross_domain_json({"result": False, "data": [u"所申请的IP超出网段范围"]})
            ip_type = "00"
            ip_str = start_ip.strip(",")
        verify_result = verify_ip_free_status(ip_list)
        if not verify_result["result"]:
            return render_cross_domain_json({"result": False, "data": verify_result["data"]})
        date_now_str = date_now()
        apply_num = date_now_str.split(" ")[0].replace("-", "")
        applies = Apply.objects.filter(apply_num__contains=apply_num).order_by("-apply_num")
        if applies.count():
            apply_num = str(int(applies[0].apply_num) + 1)
        else:
            apply_num += "0001"
        moudle_obj = Apply.objects.create(
            apply_num=apply_num,
            when_created=date_now_str,
            when_expired=when_expired,
            ip_list=ip_str,
            ip_type=ip_type,
            created_by=owner,
            business=app_name,
            apply_reason=app_name,
            description=app_name,
            ip_pool=pool_obj[0],
            email=owner_mail,
            dns=pool_obj[0].dns,
            gate_way=pool_obj[0].gate_way,
            net_mask=pool_obj[0].net_mask
        )
        # 发送邮件
        mails = Mailboxes.objects.all().values('mailbox')
        to = []
        for i in mails:
            if i['mailbox'] not in to:
                to.append(i['mailbox'])
        subject = '新增ip申请'
        content = u'收到新增IP的申请单，请到{0}#applyList 查看审批' \
            .format(BK_PAAS_HOST + SITE_URL)
        receivers = ",".join(to)
        new_send_email.delay(receivers, subject, content)
        log = OperationLog()
        log.create_log(None, moudle_obj, "add", app_name)
        del log
        return render_cross_domain_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_cross_domain_json({"result": False})
