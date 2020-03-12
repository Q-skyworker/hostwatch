# -*-encoding=utf-8 -*-
from common.log import logger
from common.mymako import render_json
from home_application.models import *
import datetime


def get_count_obj(request):
    try:
        apply_list, categories = set_apply_chart()
        assi_ips_len = IPs.objects.filter(is_deleted=False, is_keep=False).count()
        used_ips_len = IPs.objects.filter(is_deleted=False, is_keep=False).exclude(ip_status="00").count()
        keep_ips_len = IPs.objects.filter(is_deleted=False, is_keep=True).count()
        pool_len = IPPools.objects.all().count()
        apply_length = Apply.objects.all().exclude(status='03').count()
        all_ips = 0
        ip_pools = IPPools.objects.all().values("all_count")
        for i in ip_pools:
            all_ips += i["all_count"]
        user_ip_list = [
            {"name": u"已使用的IP数", "y": used_ips_len, "color": "#f7a35c"},
            {"name": u"已分配未使用的IP数", "y": assi_ips_len - used_ips_len, "color": "#90ed7d"},
            {"name": u"未分配的IP数", "y": all_ips - assi_ips_len-keep_ips_len,"color":"#7cb5ec"},
            {"name": u"保留的IP数", "y": keep_ips_len, "color": "#7cb5ec"},
        ]
        return render_json({
            "result": True,
            "data": {"assiIps": assi_ips_len, "usedIps": used_ips_len, "applyLength": apply_length, "netLen": pool_len},
            "applyList": apply_list,
            "userIpList": user_ip_list,
            "categories": categories
        })
    except Exception, e:
        logger.exception(e)
        return render_json({"result": False, "data": [u"系统出错，请联系管理员！"]})


def set_apply_chart():
    dateNow = datetime.datetime.now()
    dateStart = dateNow + datetime.timedelta(days=-9)
    return_data = [{"name": u"申请单数", "data": []}]
    categories = []
    for i in xrange(10):
        dateBegin = dateStart + datetime.timedelta(days=i)
        date_start = str(dateBegin.date()) + " 00:00:00"
        date_end = str(dateBegin.date()) + " 23:59:59"
        applies = Apply.objects.filter(when_created__range=(date_start, date_end)).exclude(status='03').count()
        return_data[0]["data"].append(applies)
        categories.append(str(dateBegin.date()).split("-")[1] + "-" + str(dateBegin.date()).split("-")[2])
    return return_data, categories
