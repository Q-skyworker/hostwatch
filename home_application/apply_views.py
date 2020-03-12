# -*- coding=utf-8 -*-
from common.mymako import render_json
from home_application.models import *
from home_application.celery_tasks import *
import json
from conf.default import BK_PAAS_HOST, SITE_URL, APP_ID

from IPy import IP


# ----------申请单操作--------------
# 网段IP地址是否在地址池里
def get_apply_ip_exist(ip_pool_list, ip_obj):
    if ip_obj["start_ip"] not in ip_pool_list:
        return False
    if ip_obj["end_ip"] not in ip_pool_list:
        return False
    return True


# 申请IP时，校验IPlist有效性
def check_apply(apply_obj, ip_pool_list=None, checked=False):
    if apply_obj["ip_type"] == "00":
        ip_str = apply_obj["ips"].strip(",")
        if checked:
            ip_list = ip_str.split(",")
            for i in ip_list:
                if i not in ip_pool_list:
                    return {"result": False, "data": [u"IP超出网段范围"]}
    else:
        ip_str = apply_obj["start_ip"] + "~" + apply_obj["end_ip"]
        if checked:
            if not get_apply_ip_exist(ip_pool_list, apply_obj):
                return {"result": False, "data": [u"IP超出网段范围"]}
            ip_list = [str(ip) for ip in netaddr.IPRange(apply_obj["start_ip"], apply_obj["end_ip"])]
    if checked:
        verify_result = verify_ip_free_status(ip_list, cloud_id=apply_obj["cloud_id"])
        if not verify_result["result"]:
            return {"result": False, "data": verify_result["data"]}
    return {"result": True, "data": ip_str}


# 发送新增申请mail
def send_newapply_mail(new_apply, username):
    mails = Mailboxes.objects.all().values('mailbox')
    to = []
    for i in mails:
        if i['mailbox'] not in to:
            to.append(i['mailbox'])
    subject = u'新增ip申请'
    content = u'收到新增IP的申请单，请到{0}#applyList 查看审批' \
        .format(BK_PAAS_HOST + SITE_URL)
    receivers = ",".join(to)
    new_send_email.delay(receivers, subject, content)

    # 日志记录
    log = OperationLog()
    log.create_log(None, new_apply, "add", username)
    del log


# 新增IP申请
def create_apply(request):
    try:
        apply_obj = json.loads(request.body)
        if apply_obj["status"] == '03':
            res = check_apply(apply_obj)
        else:
            ip_pool_list = IP(IPPools.objects.get(id=apply_obj["ip_pool_id"]).ip_net)
            res = check_apply(apply_obj, ip_pool_list, checked=True)
        if not res['result']:
            return render_json(res)
        ip_str = res['data']
        date_now_str = date_now()
        apply_num = date_now_str.split(" ")[0].replace("-", "")
        applies = Apply.objects.filter(apply_num__contains=apply_num).order_by("-apply_num")
        if applies.count():
            apply_num = str(int(applies[0].apply_num) + 1)
        else:
            apply_num += "0001"
        module_obj = Apply.objects.create(
            apply_num=apply_num,
            when_created=date_now_str,
            when_expired=apply_obj["when_expired"],
            ip_list=ip_str,
            ip_type=apply_obj["ip_type"],
            created_by=request.user.username,
            business=apply_obj["business"],
            apply_reason=apply_obj["apply_reason"],
            description=apply_obj["description"],
            ip_pool_id=apply_obj["ip_pool_id"],
            cloud_id=apply_obj["cloud_id"],
            email=apply_obj["email"],
            net_mask=apply_obj["net_mask"],
            gate_way=apply_obj["gate_way"],
            dns=apply_obj["dns"],
            status=apply_obj["status"],
        )

        # 预存自定义属性值
        attr_temp = [AttrValueTemp(apply=module_obj, ip_attr_id=i["id"], value=i["value"]) for i in
                     apply_obj["attr_list"]]
        AttrValueTemp.objects.bulk_create(attr_temp)

        # 提交发送邮件
        if apply_obj["status"] == '00':
            append_data = [{"name": i.ip_attr.cn_name, "value": i.value} for i in attr_temp]
            module_obj.attr_obj = append_data
            send_newapply_mail(module_obj, request.user.username)
        return render_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统出错，请联系管理员！"]})


# 编辑修改申请单
def edit_apply_obj(request):
    apply_obj = json.loads(request.body)
    try:
        # 判断IP是否超出网段范围
        if apply_obj["status"] == '03':
            res = check_apply(apply_obj)
        else:
            ip_pool_list = IP(Apply.objects.get(id=int(apply_obj["id"])).ip_pool.ip_net)
            res = check_apply(apply_obj, ip_pool_list, checked=True)
        if not res['result']:
            return render_json(res)
        ip_str = res['data']
        Apply.objects.filter(id=int(apply_obj["id"])).update(when_expired=apply_obj["when_expired"], ip_list=ip_str,
                                                             ip_type=apply_obj["ip_type"],
                                                             business=apply_obj["business"],
                                                             apply_reason=apply_obj["apply_reason"],
                                                             description=apply_obj["description"],
                                                             email=apply_obj["email"],
                                                             ip_pool_id=apply_obj["ip_pool_id"],
                                                             cloud_id=apply_obj["cloud_id"],
                                                             net_mask=apply_obj["net_mask"],
                                                             gate_way=apply_obj["gate_way"],
                                                             dns=apply_obj["dns"],
                                                             status=apply_obj["status"])
        new_apply_obj = Apply.objects.get(id=int(apply_obj["id"]))

        # 自定义属性修改
        append_data = []
        for i in apply_obj["attr_list"]:
            if not i["temp_id"]:
                attr_temp_obj = AttrValueTemp.objects.create(apply_id=new_apply_obj.id, ip_attr_id=i["ip_attr_id"],
                                                             value=i["value"])
                append_data.append({"name": attr_temp_obj.ip_attr.cn_name, "value": ""})
            else:
                attr_temp_obj = AttrValueTemp.objects.filter(id=i["temp_id"])
                append_data.append({"name": i["cn_name"], "value": attr_temp_obj[0].value})
                AttrValueTemp.objects.filter(id=i["temp_id"]).update(value=i["value"])

        # 提交发送邮件
        if apply_obj["status"] == '00':
            new_apply_obj.attr_obj = append_data
            send_newapply_mail(new_apply_obj, request.user.username)
        return render_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统出错，请联系管理员！"]})


# ----------续约申请单操作--------------
# 续约IP，检验IP是否可续约
def check_renewal(apply_obj, user_ip_list=None, checked=False):
    if apply_obj["ip_type"] == "00":
        ip_str = apply_obj["ips"].strip(",")
        ip_list = ip_str.split(",")
    else:
        ip_list = [str(ip) for ip in netaddr.IPRange(apply_obj["start_ip"], apply_obj["end_ip"])] if (
                apply_obj["start_ip"] != "" and apply_obj["end_ip"] != "") else []
        ip_str = apply_obj["start_ip"] + "~" + apply_obj["end_ip"]
    if checked:
        return_data = [i for i in ip_list if i not in user_ip_list]
        if return_data:
            return {"result": False, "data": [u"以下IP不是你所管理：%s" % return_data]}
    return {"result": True, "data": ip_str}


# 发送新增申请mail
def send_renewal_apply_mail(renewal_apply, username):
    mails = Mailboxes.objects.all().values('mailbox')
    to = []
    for i in mails:
        if i['mailbox'] not in to:
            to.append(i['mailbox'])
    subject = '新增续约ip申请'
    content = u'收到新增续约IP的申请单，请到{0}#applyList 查看审批' \
        .format(BK_PAAS_HOST + SITE_URL)
    receivers = ",".join(to)
    new_send_email.delay(receivers, subject, content)

    log = OperationLog()
    log.create_log(None, renewal_apply, "add", username)
    del log


# 新增续约申请
def new_renewal_apply_obj(request):
    username = request.user.username
    apply_obj = json.loads(request.body)
    try:
        if apply_obj["status"] == '03':
            res = check_renewal(apply_obj)
        else:
            user_ip_list = [i.ip for i in IPs.objects.filter(owner=username, cloud_id=apply_obj["cloud_id"],
                                                             is_keep=False, is_deleted=False)]
            res = check_renewal(apply_obj, user_ip_list, checked=True)
        if not res['result']:
            return render_json(res)
        ip_str = res['data']
        date_now_str = date_now()
        apply_num = date_now_str.split(" ")[0].replace("-", "")
        applies = Apply.objects.filter(apply_num__contains=apply_num).order_by("-apply_num")
        if applies.count():
            apply_num = str(int(applies[0].apply_num) + 1)
        else:
            apply_num += "0001"
        module_obj = Apply.objects.create(
            apply_num=apply_num,
            when_created=date_now_str,
            when_expired=apply_obj["when_expired"],
            ip_list=ip_str,
            cloud_id=apply_obj["cloud_id"],
            ip_type=apply_obj["ip_type"],
            created_by=username,
            apply_reason=apply_obj["apply_reason"],
            email=apply_obj["email"],
            apply_type="01",
            status=apply_obj["status"]
        )
        if apply_obj["status"] == '00':
            send_renewal_apply_mail(module_obj, username)
        return render_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统异常，请联系管理员！"]})


# 编辑修改续约申请单
def edit_renewal_apply_obj(request):
    username = request.user.username
    apply_obj = json.loads(request.body)
    try:
        if apply_obj["status"] == '03':
            res = check_renewal(apply_obj)
        else:
            user_ip_list = [i.ip for i in IPs.objects.filter(owner=username, cloud_id=apply_obj["cloud_id"],
                                                             is_keep=False, is_deleted=False)]
            res = check_renewal(apply_obj, user_ip_list, checked=True)
        if not res['result']:
            return render_json(res)
        ip_str = res['data']
        Apply.objects.filter(id=apply_obj["id"]).update(status=apply_obj["status"], ip_list=ip_str, apply_type="01",
                                                        email=apply_obj["email"], cloud_id=apply_obj["cloud_id"],
                                                        ip_type=apply_obj["ip_type"],
                                                        when_expired=apply_obj["when_expired"],
                                                        apply_reason=apply_obj["apply_reason"])
        if apply_obj["status"] == '00':
            new_obj = Apply.objects.get(id=apply_obj["id"])
            send_renewal_apply_mail(new_obj, username)
        return render_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统异常，请联系管理员！"]})


# 获取用户申请单信息
def get_apply_obj(request):
    filter_obj = json.loads(request.body)
    try:
        apply_obj = Apply.objects.get(id=int(filter_obj["id"]))
        apply_list = apply_obj.to_dic()
        if apply_obj.ip_type == "01":
            apply_list["start_ip"] = apply_obj.ip_list.split("~")[0]
            apply_list["end_ip"] = apply_obj.ip_list.split("~")[1]
        else:
            apply_list["start_ip"] = apply_list["end_ip"] = ""
        return render_json({"result": True, "data": apply_list})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统出错，请联系管理员！"]})


# 删除申请单
def del_apply_obj(request):
    apply_obj = json.loads(request.body)
    # username = request.user.username
    try:
        del_obj = Apply.objects.get(id=int(apply_obj["id"]))
        del_obj.delete()
        # 临时创建 临时删除无日志 不提交没日志
        return render_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统出错，请联系管理员！"]})


# 获取用户自己的申请单
def search_user_apply(request):
    filter_obj = json.loads(request.body)
    username = request.user.username
    try:
        if filter_obj["apply_type"]:
            apply_list = Apply.objects.filter(apply_type=filter_obj["apply_type"],
                                              business__icontains=filter_obj["business"], created_by=username,
                                              is_deleted=False).order_by("-when_created")
        else:
            apply_list = Apply.objects.filter(business__icontains=filter_obj["business"], created_by=username,
                                              is_deleted=False).order_by("-when_created")
        return_data = []
        for a in apply_list:
            if a.ip_type == "01":
                ips = a.ip_list.split("~")
                ip_pool = netaddr.IPRange(ips[0], ips[1]) if ips[0] != '' and ips[1] != 0 else []
                ip_pool_str = str([str(u) for u in ip_pool])
                if filter_obj["ip"] in ip_pool_str:
                    apply_obj = a.to_dic()
                    apply_obj["ips"] = ""
                    apply_obj["start_ip"] = ips[0]
                    apply_obj["end_ip"] = ips[1]
                    apply_obj[
                        "apply_type_name"] = u"IP申请" if a.apply_type == "00" else "续约申请" if a.apply_type == "01" else "未知"
                    apply_obj[
                        "status_name"] = u"待审批" if a.status == "00" else "已通过" if a.status == "01" else "被拒绝" if a.status == "02" else "未提交"
                    return_data.append(apply_obj)
            elif filter_obj["ip"] in a.ip_list:
                apply_obj = a.to_dic()
                apply_obj["ips"] = apply_obj["ip_list"]
                apply_obj["start_ip"] = ""
                apply_obj["end_ip"] = ""
                apply_obj[
                    "apply_type_name"] = u"IP申请" if a.apply_type == "00" else "续约申请" if a.apply_type == "01" else "未知"
                apply_obj[
                    "status_name"] = u"待审批" if a.status == "00" else "已通过" if a.status == "01" else "被拒绝" if a.status == "02" else "未提交"
                return_data.append(apply_obj)
        return render_json({"result": True, "data": return_data})
    except Exception, e:
        logger.exception(e)
        return render_json({"result": False, "data": [u"系统出错，请联系管理员！"]})


# 搜索未完申请的申请单
def search_admin_apply(request):
    try:
        filter_obj = eval(request.body)
        if filter_obj["apply_type"]:
            apply_list = Apply.objects.filter(business__icontains=filter_obj["business"], status="00",
                                              created_by__icontains=filter_obj["created_by"], is_deleted=False,
                                              apply_type=filter_obj["apply_type"])
        else:
            apply_list = Apply.objects.filter(business__icontains=filter_obj["business"], status="00",
                                              created_by__icontains=filter_obj["created_by"], is_deleted=False)
        return_data = []
        for c in apply_list:
            if c.ip_type == "01":
                ips = c.ip_list.split("~")
                ip_pool = netaddr.IPRange(ips[0], ips[1])
                ip_pool_str = str([str(u) for u in ip_pool])
                if filter_obj["ip"] in ip_pool_str:
                    one_data = c.to_dic()
                    one_data["ips"] = ""
                    one_data["start_ip"] = ips[0]
                    one_data["end_ip"] = ips[1]
                    one_data[
                        "apply_type_name"] = u"IP申请" if c.apply_type == "00" else "续约申请" if c.apply_type == "01" else "未知"
                    # one_data["ip_list"] = one_data["ip_list"].replace(",", "~")
                    return_data.append(one_data)
            elif filter_obj["ip"] in c.ip_list:
                one_data = c.to_dic()
                one_data["ips"] = one_data["ip_list"]
                one_data["start_ip"] = ""
                one_data["end_ip"] = ""
                one_data[
                    "apply_type_name"] = u"IP申请" if c.apply_type == "00" else "续约申请" if c.apply_type == "01" else "未知"
                return_data.append(one_data)
        return render_json({"result": True, "data": return_data})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统出错，请联系管理员！"]})


# 搜索已完申请单
def search_complete_apply(request):
    try:
        filter_obj = json.loads(request.body)
        if filter_obj["apply_type"]:
            apply_list = Apply.objects.filter(business__icontains=filter_obj["business"],
                                              created_by__icontains=filter_obj["created_by"],
                                              status__icontains=filter_obj["status"],
                                              apply_type=filter_obj["apply_type"]).exclude(status__in=["00", "03"])
        else:
            apply_list = Apply.objects.filter(business__icontains=filter_obj["business"],
                                              created_by__icontains=filter_obj["created_by"],
                                              status__icontains=filter_obj["status"]).exclude(status__in=["00", "03"])
        return_data = []
        for c in apply_list:
            if c.ip_type == "01":
                ips = c.ip_list.split("~")
                ip_pool = netaddr.IPRange(ips[0], ips[1])
                ip_pool_str = str([str(u) for u in ip_pool])
                if filter_obj["ip"] in ip_pool_str:
                    apply_obj = c.to_dic()
                    apply_obj["ips"] = ""
                    apply_obj["start_ip"] = ips[0]
                    apply_obj["end_ip"] = ips[1]
                    apply_obj["status_name"] = u"已通过" if c.status == "01" else u"被拒绝"
                    apply_obj[
                        "apply_type_name"] = u"IP申请" if c.apply_type == "00" else "续约申请" if c.apply_type == "01" else "未知"
                    # apply_obj["ip_list"] = apply_obj["ip_list"].replace(",", "~")
                    return_data.append(apply_obj)
            elif filter_obj["ip"] in c.ip_list:
                apply_obj = c.to_dic()
                apply_obj["ips"] = apply_obj["ip_list"]
                apply_obj["start_ip"] = ""
                apply_obj["end_ip"] = ""
                apply_obj["status_name"] = u"已通过" if c.status == "01" else u"被拒绝"
                apply_obj[
                    "apply_type_name"] = u"IP申请" if c.apply_type == "00" else "续约申请" if c.apply_type == "01" else "未知"
                return_data.append(apply_obj)
        return render_json({"result": True, "data": return_data})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统出错，请联系管理员！"]})


# 审批通过用户申请
def approve_apply(request):
    try:
        apply_id = json.loads(request.body)["id"]
        date_now_str = date_now()
        apply_obj = Apply.objects.get(id=apply_id)
        apply_obj.when_approved = date_now_str
        apply_obj.approved_by = request.user.username
        apply_obj.save()
        result = add_ips(apply_obj)
        if result["result"]:
            apply_obj.status = "01"
            apply_obj.save()
        else:
            return render_json(result)
        new_module = Apply.objects.get(id=apply_id)
        log = OperationLog()
        log.create_log(None, new_module, "approve", request.user.username)
        del log
        # 发送邮件
        to = apply_obj.email
        subject = '新增ip申请已同意'
        content = u"申请单已同意，单号：{0}，请到{1}#applyList 查看详情" \
            .format(apply_obj.apply_num, BK_PAAS_HOST + SITE_URL)
        new_send_email.delay(to, subject, content)
        return render_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统出错，请联系管理员！"]})


# 拒绝申请单
def refuse_apply(request):
    try:
        apply_obj = json.loads(request.body)
        date_now_str = date_now()
        Apply.objects.filter(id=apply_obj["id"]).update(
            status="02",
            refuse_reason=apply_obj["refuse_reason"],
            when_approved=date_now_str,
            approved_by=request.user.username
        )
        new_module = Apply.objects.get(id=apply_obj["id"])
        log = OperationLog()
        log.create_log(None, new_module, "refuse", request.user.username)
        del log
        # 发送邮件
        to = apply_obj["email"]
        subject = u'新增ip申请被拒绝'
        content = u"申请单被拒绝，单号：{0}，请到{1}#applyList 查看详情" \
            .format(apply_obj["apply_num"], BK_PAAS_HOST + SITE_URL)
        new_send_email.delay(to, subject, content)
        return render_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统出错，请联系管理员！"]})


def add_ips(apply_obj):
    try:
        if apply_obj.ip_type == "00":
            ip_list = apply_obj.ip_list.strip(",").split(",")
        else:
            ips = apply_obj.ip_list.split("~")
            ip_list = [str(ip) for ip in netaddr.IPRange(ips[0], ips[1])]
        v_result = verify_ip_free_status(ip_list, is_scan=True, cloud_id=apply_obj.cloud_id)
        if not v_result["result"]:
            return v_result

        # 申请单自定义临时表
        attr_temp = AttrValueTemp.objects.filter(apply_id=apply_obj.id)
        for one_ip in ip_list:
            ip_obj = IPs.objects.create(ip=one_ip, business=apply_obj.business, cloud_id=apply_obj.cloud_id,
                                        when_expired=apply_obj.when_expired, owner=apply_obj.created_by,
                                        owner_mail=apply_obj.email, created_by=apply_obj.approved_by,
                                        modified_by=apply_obj.approved_by, when_modified=apply_obj.when_approved,
                                        when_created=apply_obj.when_approved, description=apply_obj.description,
                                        ip_pool_id=apply_obj.ip_pool.id, net_mask=apply_obj.net_mask,
                                        gate_way=apply_obj.gate_way, dns=apply_obj.dns)
            ApplyIP.objects.create(ip=ip_obj, apply=apply_obj)

            # 自定义属性创建
            attr_value_list = [AttrValue(value=i.value, ip_id=ip_obj.id, ip_attr_id=i.ip_attr_id) for i in attr_temp]
            AttrValue.objects.bulk_create(attr_value_list)
        scan_ip_usage.delay(ip_list, apply_obj.cloud_id)
        return {"result": True}
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return {"result": False, "data": [u"系统出错，请联系管理员"]}


# 审批续约申请
def approve_renewal_apply(request):
    username = request.user.username
    apply_obj = json.loads(request.body)
    user_ip_list = [i.ip for i in IPs.objects.filter(owner=apply_obj["created_by"], cloud_id=apply_obj["cloud_id"],
                                                     is_keep=False, is_deleted=False)]
    try:
        # 判断所有续约申请IP是否申请人所管理
        if apply_obj["ip_type"] == "00":
            ip_list = apply_obj["ips"].strip(",").split(",")
        else:
            ip_list = [str(ip) for ip in netaddr.IPRange(apply_obj["start_ip"], apply_obj["end_ip"])]
        return_data = [i for i in ip_list if i not in user_ip_list]
        if return_data:
            return render_json({"result": False, "data": [u"以下IP不是申请人【%s】所管理：%s" % (apply_obj["owner"], return_data)]})
        # 审批续约申请
        now_time = date_now()
        renewal_obj = Apply.objects.get(id=apply_obj["id"])
        renewal_obj.when_approved = now_time
        renewal_obj.approved_by = username
        # 修改过期时间
        for i in ip_list:
            IPs.objects.filter(ip=i, owner=apply_obj["created_by"], cloud_id=apply_obj["cloud_id"], is_keep=False,
                               is_deleted=False).update(when_expired=apply_obj["when_expired"], modified_by=username,
                                                        when_modified=now_time)
            for j in IPs.objects.filter(ip=i, owner=apply_obj["created_by"], cloud_id=apply_obj["cloud_id"],
                                        is_keep=False, is_deleted=False):
                ApplyIP.objects.create(apply=renewal_obj, ip=j)
        renewal_obj.status = "01"
        renewal_obj.save()
        new_obj = Apply.objects.get(id=apply_obj["id"])
        log = OperationLog()
        log.create_log(None, new_obj, "approve", username)
        del log
        # 发送邮件
        to = renewal_obj.email
        subject = 'IP续约申请已同意'
        content = u"申请单已同意，单号：{0}，请到{1}#applyList 查看详情" \
            .format(renewal_obj.apply_num, BK_PAAS_HOST + SITE_URL)
        new_send_email.delay(to, subject, content)
        return render_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统异常，请联系管理员！"]})


# 获取申请单中IP的自定义属性
def get_apply_attr(request):
    try:
        apply_id = json.loads(request.body)["id"]
        attr_obj = IPAttr.objects.filter(attr_type="ip")
        attr_list = [i.to_dic() for i in attr_obj]
        return_data = []
        for i in attr_list:
            attr_temp_obj = AttrValueTemp.objects.filter(apply_id=apply_id, ip_attr_id=i["id"])
            if attr_temp_obj.exists():
                return_data.append(dict(i, **{"temp_id": attr_temp_obj[0].id, "apply_id": apply_id,
                                              "ip_attr_id": i["id"], "value": attr_temp_obj[0].value}))
            else:
                return_data.append(
                    dict(i, **{"temp_id": "", "apply_id": apply_id, "ip_attr_id": i["id"], "value": ""}))

        return render_json({"result": True, "data": return_data})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统异常，请联系管理员！"]})
