# -*- coding: utf-8 -*-

from common.mymako import render_json
import json
from home_application.celery_tasks import *
from conf.default import PROJECT_ROOT
import pymysql
from IPy import IP
from esb.client import *
from conf.default import APP_ID, APP_TOKEN, BK_PAAS_HOST
import requests
from home_application.models import AttrValue, IPAttr
from help.sys_helper import *
from django.http import HttpResponse
from account.decorators import login_exempt
from blueking.component.shortcuts import get_client_by_user
from home_application.decorator import *


# 普通用户查询IP列表
def search_user_ips(request):
    try:
        filter_obj = json.loads(request.body)
        if filter_obj["ip_status"]:
            ip_list = IPs.objects.filter(ip__icontains=filter_obj["ip"], business__icontains=filter_obj["business"],
                                         owner=request.user.username,
                                         is_expired=False, ip_status=filter_obj["ip_status"], is_deleted=False)
        else:
            ip_list = IPs.objects.filter(ip__icontains=filter_obj["ip"], business__icontains=filter_obj["business"],
                                         owner=request.user.username,
                                         is_expired=False, is_deleted=False)
        return_data = [i.to_dic() for i in ip_list]
        for i in return_data:
            if i["ip_status"] == "00":
                i["status"] = "已分配"
            elif i["ip_status"] == "01":
                i["status"] = "使用中"
            elif i["ip_status"] == "02":
                i["status"] = "释放中"
            else:
                i["status"] = "未知"
        return render_json({"result": True, "data": return_data})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统出错，请联系管理员！"]})


# 管理员查看IP列表 （分配IP）
def search_admin_ips(request):
    try:
        filter_obj = json.loads(request.body)
        if not filter_obj["ip_status"]:
            ip_list = IPs.objects.filter(ip__icontains=filter_obj["ip"], owner__icontains=filter_obj["owner"],
                                         business__icontains=filter_obj["business"], is_keep=False, is_deleted=False)
        else:
            ip_list = IPs.objects.filter(ip__icontains=filter_obj["ip"], owner__icontains=filter_obj["owner"],
                                         business__icontains=filter_obj["business"], is_keep=False,
                                         ip_status=filter_obj["ip_status"], is_deleted=False)
        return_data = [i.to_dic() for i in ip_list]
        for i in return_data:
            if i["ip_status"] == "00":
                i["status"] = "已分配"
            elif i["ip_status"] == "01":
                i["status"] = "使用中"
            elif i["ip_status"] == "02":
                i["status"] = "释放中"
            else:
                i["status"] = "未知"
        return render_json({"result": True, "data": return_data})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统出错，请联系管理员！"]})


def subject_search_admin_ips(request):
    try:
        filter_obj = eval(request.body)
        ip_list = IPs.objects.filter(business__icontains=filter_obj["business"], is_admin=False)
        return_data = []
        for i in ip_list:
            ip_pool = netaddr.IPRange(i.start_ip, i.end_ip)
            ip_pool_str = str([str(u) for u in ip_pool])
            if filter_obj["ip"] in ip_pool_str:
                return_data.append(i.to_dic())
        return render_json({"result": True, "data": return_data})
    except Exception, e:
        logger.exception(e)
        return render_json({"result": False, "data": [u"系统出错，请联系管理员！"]})


# 新增分配
def create_ips(request):
    try:
        username = request.user.username
        ip_obj = json.loads(request.body)
        ip_pool_list = IP(IPPools.objects.get(id=ip_obj["ip_pool_id"]).ip_net)
        if ip_obj["ipType"] == "00":
            # 检查是否有IP超出网段范围
            ip_list = ip_obj["ips"].strip(",").split(",")
            v_data = [i for i in ip_list if not i in ip_pool_list]
            if v_data:
                v_data.insert(0, u"以下IP超出网段范围：")
                return render_json({"result": False, "data": v_data})
            ip_str = ip_obj["ips"].strip(",")
        else:
            # 检查起始、结束IP是否超出网段范围
            if ip_obj["start_ip"] not in ip_pool_list:
                return render_json({"result": False, "data": [u"起始IP超出网段范围"]})
            if ip_obj["end_ip"] not in ip_pool_list:
                return render_json({"result": False, "data": [u"结束IP超出网段范围"]})
            ip_str = ip_obj["start_ip"] + "~" + ip_obj["end_ip"]
            ip_list = [str(ip) for ip in netaddr.IPRange(ip_obj["start_ip"], ip_obj["end_ip"])]
        # 检查IP是否已分配、保留、已使用（未经过流程申请）
        verify_result = verify_ip_free_status(ip_list, ip_obj["cloud_id"])
        if not verify_result["result"]:
            return render_json({"result": False, "data": verify_result["data"]})
        add_result = add_apply_keep_ips(ip_obj, username, "apply")
        if add_result["result"]:
            scan_ip_usage.delay(ip_list, ip_obj["cloud_id"])
            return render_json({"result": True})
        else:
            return render_json({"result": False, "data": add_result["data"]})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统出错，请联系管理员！"]})


def modify_ips(request):
    try:
        date_now_str = date_now()
        username = request.user.username
        ip_obj = json.loads(request.body)
        result = validate_ips_exclude_self(ip_obj["start_ip"], ip_obj["end_ip"], ip_obj["id"])
        if not result["result"]:
            return render_json(result)
        ip_pool = IPPools.objects.get(id=ip_obj["ip_pool_id"])
        ip_pool_list = IP(ip_pool.ip_net)
        if not get_ip_exist(ip_pool_list, ip_obj):
            return render_json({"result": False, "data": [u"所选IP范围超出IP资源池"]})
        IPs.objects.filter(id=ip_obj["id"]).update(
            start_ip=ip_obj["start_ip"],
            end_ip=ip_obj["end_ip"],
            business=ip_obj["business"],
            when_expired=ip_obj["when_expired"],
            modified_by=username,
            when_modified=date_now_str,
            description=ip_obj["description"],
            owner=ip_obj["owner_name"]
        )
        ip_query = IPs.objects.get(id=ip_obj["id"])
        get_ips_usage.delay(ip_query)
        # insert_log(u"IP管理", request.user.username, u"修改网段：起始IP--%s，结束IP--%s" % (ip_query.start_ip, ip_query.end_ip))
        return render_json({"result": True})
    except Exception, e:
        logger.exception(e)
        return render_json({"result": False, "data": [u"系统出错，请联系管理员！"]})


# 删除已分配、保留IP
def delete_ips(request):
    try:
        ip_id = request.GET["id"]
        ip_obj = IPs.objects.get(id=ip_id)
        ip_obj.is_deleted = True
        ip_obj.save()
        # ip_obj.delete()
        log = OperationLog()
        log.create_log(ip_obj, None, "delete", request.user.username)
        del log
        return render_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统出错，请联系管理员！"]})


# IP使用检测
def detect_ips(request):
    try:
        ip_type = request.GET["ip_type"]
        if ip_type == "00":
            ips = request.GET["ips"]
            ip_list = ips.split(",")
            ip_result = one_ip_scan(ip_list)
        else:
            start_ip = request.GET["start_ip"]
            end_ip = request.GET["end_ip"]
            ip_list = [str(ip) for ip in netaddr.IPRange(start_ip, end_ip)]
            ip_result = IPNetScan(start_ip, end_ip)
        not_use_list = [i for i in ip_list if i not in ip_result]
        return render_json({"result": True, "use": ip_result, "unused": not_use_list})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统出错，请联系管理员！"]})


# 分配查询
def allocation_search(request):
    try:
        ip_type = request.GET["ip_type"]
        ip_all = IPs.objects.filter(is_deleted=False, cloud_id=request.GET["cloud_id"])
        ip_allocation = [i.ip for i in ip_all]
        use_list = []
        not_use_list = []
        if ip_type == "00":
            ips = request.GET["ips"]
            ip_list = ips.strip(",").split(",")
        else:
            start_ip = request.GET["start_ip"]
            end_ip = request.GET["end_ip"]
            ip_list = [str(ip) for ip in netaddr.IPRange(start_ip, end_ip)]
        for i in ip_list:
            if i in ip_allocation:
                use_list.append(i)
            else:
                not_use_list.append(i)
        return render_json({"result": True, "use": use_list, "unused": not_use_list})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统出错，请联系管理员！"]})


def get_ip_exist(ip_pool_list, ip_obj):
    if ip_obj["start_ip"] not in ip_pool_list:
        return False
    if ip_obj["end_ip"] not in ip_pool_list:
        return False
    return True


def get_all_mails(request):
    try:
        client = get_client_by_user(request.user.username)
        result = client.bk_login.get_all_users()
        mail_list = []
        for i, j in enumerate(result['data']):
            if not result['data'][i]['email']:
                del result['data'][i]
        id = 0
        for i in result['data']:
            id += 1
            mail_list.append({"user_name": i["bk_username"], "email": i["email"]})
        return render_json({"result": True, "data": mail_list})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统出错，请联系管理员！"]})


# 查询保留地址
def search_keep_ips(request):
    filter_obj = json.loads(request.body)
    try:
        if not filter_obj["ip_status"]:
            ip_list = IPs.objects.filter(ip__icontains=filter_obj["ip"], owner__icontains=filter_obj["owner"],
                                         business__icontains=filter_obj["business"], is_keep=True, is_deleted=False)
        else:
            ip_list = IPs.objects.filter(ip__icontains=filter_obj["ip"], owner__icontains=filter_obj["owner"],
                                         business__icontains=filter_obj["business"], is_keep=True,
                                         ip_status=filter_obj["ip_status"], is_deleted=False)
        return_data = [i.to_dic() for i in ip_list]
        for i in return_data:
            if i["ip_status"] == "00":
                i["status"] = "已分配"
            elif i["ip_status"] == "01":
                i["status"] = "使用中"
            elif i["ip_status"] == "02":
                i["status"] = "释放中"
            else:
                i["status"] = "未知"
        return render_json({"result": True, "data": return_data})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统出错，请联系管理员！"]})


# 新增保留IP
def create_keep_ips(request):
    ip_obj = json.loads(request.body)
    try:
        username = request.user.username
        ip_pool_list = IP(IPPools.objects.get(id=ip_obj["ip_pool_id"]).ip_net)
        if ip_obj["ipType"] == "00":
            # 检查是否有IP超出网段范围
            ip_list = ip_obj["ips"].strip(",").split(",")
            v_data = [i for i in ip_list if not i in ip_pool_list]
            if v_data:
                v_data.insert(0, u"以下IP超出网段范围：")
                return render_json({"result": False, "data": v_data})
        else:
            # 检查起始、结束IP是否超出网段范围
            if ip_obj["start_ip"] not in ip_pool_list:
                return render_json({"result": False, "data": [u"起始IP超出网段范围"]})
            if ip_obj["end_ip"] not in ip_pool_list:
                return render_json({"result": False, "data": [u"结束IP超出网段范围"]})
            ip_list = [str(ip) for ip in netaddr.IPRange(ip_obj["start_ip"], ip_obj["end_ip"])]
        # 检查IP是否已分配、保留、已使用（未经过流程申请）
        verify_result = verify_ip_free_status(ip_list, ip_obj["cloud_id"])
        if not verify_result["result"]:
            return render_json({"result": False, "data": verify_result["data"]})
        add_result = add_apply_keep_ips(ip_obj, username, "keep")
        if add_result["result"]:
            scan_ip_usage.delay(ip_list, ip_obj["cloud_id"])
            return render_json({"result": True})
        else:
            return render_json({"result": False, "data": add_result["data"]})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统出错，请联系管理员！"]})


# 获取ip的自定义字段属性
def get_ip_attr_value(request):
    filter_obj = json.loads(request.body)
    username = request.user.username
    try:
        user_result = get_all_users(username)
        if not user_result["result"]:
            logger.error(user_result["data"])
            return render_json({"result": False, "data": [u"获取平台用户信息失败"]})
        n = 0
        for user_obj in user_result["data"]:
            user_obj["id"] = n
            user_obj["text"] = user_obj["bk_username"]
            n += 1
        attr_obj = IPAttr.objects.filter(attr_type="ip")
        attr_list = [i.to_dic() for i in attr_obj]
        return_data = []
        for i in attr_list:
            ip_attr_obj = AttrValue.objects.filter(ip_id=filter_obj["id"], ip_attr_id=i["id"])
            if ip_attr_obj.exists():
                return_data.append(dict(i, **{"value_id": ip_attr_obj[0].id, "ip_id": filter_obj["id"],
                                              "ip_attr_id": i["id"], "value": ip_attr_obj[0].value}))
            else:
                return_data.append(
                    dict(i, **{"value_id": "", "ip_id": filter_obj["id"], "ip_attr_id": i["id"], "value": ""}))
        return render_json({"result": True, "attr_data": return_data, "user_data": user_result["data"]})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"获取IP自定义属性信息失败"]})


# 修改IP的属性
def modify_ip_obj(request):
    filter_obj = json.loads(request.body)
    try:
        # IP属性修改
        old_module = IPs.objects.get(id=filter_obj["id"])
        IPs.objects.filter(id=filter_obj["id"]).update(
            owner=filter_obj["owner"], owner_mail=filter_obj["owner_mail"], when_expired=filter_obj["when_expired"],
            business=filter_obj["business"], description=filter_obj["description"], net_mask=filter_obj["net_mask"],
            dns=filter_obj["dns"], gate_way=filter_obj["gate_way"])

        # 自定义属性修改
        append_data = []
        for i in filter_obj["attrObj"]:
            if not i["value_id"]:
                attr_value_obj = AttrValue.objects.create(ip_id=i["ip_id"], ip_attr_id=i["ip_attr_id"],
                                                          value=i["value"])
                append_data.append({"value_id": attr_value_obj.id, "cn_name": attr_value_obj.ip_attr.cn_name,
                                    "value": ""})
            else:
                attr_value_obj = AttrValue.objects.filter(id=i["value_id"])
                append_data.append(
                    {"value_id": i["value_id"], "cn_name": i["cn_name"], "value": attr_value_obj[0].value})
                AttrValue.objects.filter(id=i["value_id"]).update(value=i["value"])
        old_module.attr_obj = append_data

        # 日志记录
        new_module = IPs.objects.get(id=filter_obj["id"])
        log = OperationLog()
        log.create_log(old_module, new_module, "update", request.user.username)
        del log
        return render_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"修改失败"]})


# 下载模板文件
@login_exempt
@TryException('download_ip_temp')
def download_ip_temp(request):
    file_path = "{0}/fixtures/ipTemp.csv".format(PROJECT_ROOT).replace("\\", "/")
    file_name = "ipTemp.csv"
    res = generate_ip_temp(file_path)
    if not res['result']:
        return render_json(res['data'])
    return download_file(file_path, file_name)


def download_file(file_path, file_name):
    file_buffer = open(file_path, 'rb').read()
    response = HttpResponse(file_buffer, content_type='APPLICATION/OCTET-STREAM')
    response['Content-Disposition'] = 'attachment; filename=' + file_name
    response['Content-Length'] = os.path.getsize(file_path)
    return response


# 动态生成模板文件
def generate_ip_temp(file_path):
    ip_attr = []
    try:
        for i in IPAttr.objects.filter(attr_type='ip'):
            if i.is_required:
                ip_attr.append("{}*".format(i.cn_name))
            else:
                ip_attr.append(i.cn_name)
        file_buffer = open(file_path, 'wb')
        temp_title = u'网段*,起始IP*,结束IP,云区域,过期时间*,管理员*,管理员邮箱*,业务系统,描述,{}'.format(','.join(ip_attr))
        temp_content = u'192.168.165.0/24,192.168.165.41,,0,2019-12-12,eli,eli@canway.net,测试环境,单IP示例\r\n' \
                       u'192.168.165.0/24,"192.168.165.42,192.168.165.45",,1,2019-12-12,eli,eli@canway.net,' \
                       u'测试环境,多IP示例\r\n' \
                       u'192.168.166.0/24,192.168.166.200,192.168.166.220,0,2020-01-01,eli,eli@canway.net,测试环境,网段示例\r\n'
        file_buffer.write('{}\r\n{}'.format(temp_title.encode("gb2312"), temp_content.encode("gb2312")))
        file_buffer.close()
        return {'result': True}
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return {'result': False, 'data': u"系统异常，请联系管理员！"}


# 批量添加分配IP
def batch_add_ip(request):
    filter_obj = json.loads(request.body)
    username = request.user.username
    now_time = date_now()
    return_data = []
    try:
        pool_list = [{'ip_net': i.ip_net, 'cloud_id': i.cloud_id} for i in IPPools.objects.all()]
        # 判断是否存在不在资源池的网段
        not_pool_list = ['{0}(云区域: {1})'.format(i["ip_net"], i['cloud_id']) for i in filter_obj if
                         {'ip_net': i["ip_net"], 'cloud_id': i["cloud_id"]} not in pool_list]
        tmp_pool_list = []
        for i in not_pool_list:
            if i not in tmp_pool_list:
                tmp_pool_list.append(i)
        not_pool_list = tmp_pool_list
        if not_pool_list:
            not_pool_list.insert(0, u"以下网段不在资源池中：")
            return render_json({"result": False, "data": not_pool_list})

        # 检查模板自定义属性是否为最新
        ip_attr = [i["key"] for i in filter_obj[0]["ip_attr"]]
        ip_attr_id = {}
        for i in ip_attr:
            is_ip_attr = IPAttr.objects.filter(cn_name=i.rstrip('*'))
            if not is_ip_attr:
                return render_json({"result": False, "data": [u"字段有误，请下载最新模板！"]})
            if re.match(r'.*[\*]$', i) and not is_ip_attr[0].is_required or \
                    not re.match(r'.*[\*]$', i) and is_ip_attr[0].is_required:
                return render_json({"result": False, "data": [u"字段有误，请下载最新模板！"]})
            ip_attr_id[i] = is_ip_attr[0].id
        ip_attr_required = [j for j in ["{}*".format(i.cn_name) for i in IPAttr.objects.filter(is_required=True)]
                            if j not in ip_attr]
        if ip_attr_required:
            return render_json({"result": False, "data": [u"必须字段不完整，请下载最新模板！"]})

        for i in filter_obj:
            pool_obj = IPPools.objects.get(ip_net=i["ip_net"], cloud_id=i["cloud_id"])
            if not i["end_ip"]:
                add_ip_list = i["start_ip"].strip(",").split(",")
            else:
                add_ip_list = [str(ip) for ip in netaddr.IPRange(i["start_ip"], i["end_ip"])]
            allot_list = [m.ip for m in IPs.objects.filter(ip_pool=pool_obj, is_deleted=False)]
            more_ip = [m for m in add_ip_list if m not in allot_list]
            add_ip = [m for m in more_ip if m in IP(i["ip_net"])]
            not_survive_ip = [m for m in more_ip if m not in IP(i["ip_net"])]
            exit_ip = [m for m in add_ip_list if m in allot_list]
            add_ip_str = ",".join(add_ip)
            obj = ""
            for m in add_ip:
                obj, result = IPs.objects.update_or_create(ip=m, ip_pool=pool_obj,
                                                           cloud_id=pool_obj.cloud_id, is_deleted=False,
                                                           defaults={
                                                               "when_expired": i["when_expired"],
                                                               "owner": i["owner"],
                                                               "owner_mail": i["owner_mail"],
                                                               "created_by": username,
                                                               "modified_by": username,
                                                               "when_created": now_time,
                                                               "when_modified": now_time,
                                                               "business": i["business"],
                                                               "description": i["description"]
                                                           })
                # 自定义属性添加
                ip_attr_objs = [AttrValue(ip_attr_id=ip_attr_id[j['key']], ip_id=obj.id, value=j['value'])
                                for j in i["ip_attr"]]
                AttrValue.objects.bulk_create(ip_attr_objs)

            if obj:
                obj.ip = add_ip_str
                log = OperationLog()
                log.create_log(None, obj, "add", username)
            if exit_ip:
                return_data.append(u"网段[%s]IP[%s]已分配，无法添加" % (pool_obj.ip_net, ",".join(exit_ip)))
            if not_survive_ip:
                return_data.append(u"网段[%s]IP[%s]不存在，无法添加" % (pool_obj.ip_net, ",".join(not_survive_ip)))
            scan_ip_usage.delay(allot_list, pool_obj.cloud_id)

        if return_data:
            return render_json({"result": False, "data": return_data})
        else:
            return render_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统异常，请联系管理员！"]})


# 普通用户上缴IP
def hand_ip_obj(request):
    username = request.user.username
    now_day = datetime.datetime.now().strftime('%Y-%m-%d')
    now_time = date_now()
    try:
        ip_id = json.loads(request.body)["id"]
        old_obj = IPs.objects.get(id=ip_id)
        v_result = one_ip_scan([old_obj.ip])
        if v_result:
            return render_json({"result": False, "data": [u"该IP正在使用无法上缴！"]})
        IPs.objects.filter(id=ip_id).update(is_expired=True, when_expired=now_day, modified_by=username,
                                            when_modified=now_time, is_deleted=True)
        new_obj = IPs.objects.get(id=ip_id)
        log = OperationLog()
        log.create_log(old_obj, new_obj, "delete", username)
        del log
        return render_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统异常，请联系管理员！"]})


# 获取平台所有用户信息
def search_all_users(request):
    username = request.user.username
    try:
        res = get_all_users(username)
        if not res["result"]:
            logger.error(res["data"])
            return render_json({"result": False, "data": [u"获取用户信息失败"]})
        n = 0
        for i in res["data"]:
            i["id"] = n
            i["text"] = i["bk_username"]
            n += 1
        return render_json({"result": True, "data": res["data"]})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统异常，请联系管理员！"]})


# 查询ip、资源池的自定义属性
def search_attr_list(request):
    try:
        filter_obj = json.loads(request.body)
        attr_obj = IPAttr.objects.filter(attr_type=filter_obj["attr_type"])
        return_data = [i.to_dic() for i in attr_obj]
        return_data = [dict(i, **{"value": ""}) for i in return_data]
        return render_json({"result": True, "data": return_data})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统异常，请联系管理员！"]})


# 获取资源池的dns\net_mask\gate_way信息
def get_pool_settings(request):
    try:
        pool_id = json.loads(request.body)["pool_id"]
        pool_obj = IPPools.objects.filter(id=pool_id)
        return render_json({"result": True, "dns": pool_obj[0].dns, "gate_way": pool_obj[0].gate_way,
                            "net_mask": pool_obj[0].net_mask, "cloud_id": pool_obj[0].cloud_id})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统异常，请联系管理员！"]})


# 获取平台业务信息
@TryException('search_business')
def search_business(request):
    username = request.user.username
    client = get_client_by_user(username)
    kwargs = {
        "fields": [
            "bk_biz_id",
            "bk_biz_name",
        ],
        "condition": {},
    }
    res = client.cc.search_business(kwargs)
    data = res.get('data', {}).get('info', {})
    data = [{'bk_biz_id': i['bk_biz_id'], 'bk_biz_name': i['bk_biz_name']} for i in data]
    if res["result"]:
        return render_json({"result": True, "data": data})
    else:
        return render_json({"result": False, "data": res["message"]})
