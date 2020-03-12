# -*- coding: utf-8 -*-

import os, sys, socket, threading, netaddr, multiprocessing, psutil, Queue
import django.utils.timezone as timezone
from home_application.models import *
from common.log import logger
import datetime
import json
import requests
from conf.default import BK_PAAS_HOST, APP_ID, APP_TOKEN
import re
from common.mymako import render_json
from blueking.component.shortcuts import get_client_by_user

def date_now():
    date_now_str = str(timezone.now()).split(".")[0]
    return date_now_str


def ping_win(dest_addr, ping_timeout, count):
    try:
        ping_cmd = "ping %s -n %s -w %s" % (dest_addr, count, ping_timeout * 1000)
        res = os.system(ping_cmd)
        if res == 0:
            return dest_addr
    except:
        pass
    return None


def ping_lin(dest_addr, ping_timeout, count):
    try:
        ping_shell = "ping %s -c %s -w %s" % (dest_addr, count, ping_timeout)
        res = os.system(ping_shell)
        if res == 0:
            return dest_addr
    except:
        pass
    return None


def test_ping(dest_addr, ping_timeout, count):
    if sys.platform == "win32":
        return ping_win(dest_addr, ping_timeout, count)
    else:
        return ping_lin(dest_addr, ping_timeout, count)


def test_arping(dest_addr, arping_timeout, count, nic):
    try:
        arping_shell = "arping %s -c %s -w %s -I %s" % (dest_addr, count, arping_timeout, nic)
        res = os.system(arping_shell)
        if res == 0:
            return dest_addr
    except:
        pass
    return None


def get_nic():
    nic_name = []
    info = psutil.net_if_addrs()
    for k, v in info.items():
        for item in v:
            if item[0] == 2 and not item[1] == '127.0.0.1':
                nic_name.append(k)
    return nic_name


def test_port(dst, port, port_timeout):
    cli_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    cli_sock.settimeout(port_timeout)
    try:
        indicator = cli_sock.connect_ex((dst, port))
        if indicator == 0:
            return dst
        cli_sock.close()
    except:
        pass
    return None


def proxy(cls_instance, o):
    return cls_instance.NetScan(o)


class IPScan():
    """
    参数：
        ping_timeout    -- ping超时，默认3秒
        port_timeout    -- port超时，默认5秒
        ports      -- 默认扫描端口列表，数据类型为list
        count      -- ping扫描次数
    """

    def __init__(self, ping_timeout=2, port_timeout=2, count=2, ports=[22, 3389]):
        self.ping_timeout = ping_timeout
        self.port_timeout = port_timeout
        self.count = count
        self.ports = ports
        self.ip_list = []

    nics = get_nic()

    def ping_scan(self, ping_q, arp_q, port_q):
        while not ping_q.empty():
            dst_addr = ping_q.get()
            if dst_addr in self.ip_list:
                pass
            else:
                ip = test_ping(dst_addr, self.ping_timeout, self.count)
                if ip:
                    self.ip_list.append(ip)
                else:
                    for port in self.ports:
                        port_q.put((dst_addr, port))
                    for nic in self.nics:
                        arp_q.put((dst_addr, nic))
                    # if sys.platform == "win32":
                    #     for port in self.ports:
                    #         port_q.put((dst_addr, port))
                    # else:
                    #     for nic in self.nics:
                    #         arp_q.put((dst_addr, nic))
                ping_q.task_done()

    def arping_scan(self, arp_q):
        while not arp_q.empty():
            arg = arp_q.get()
            dst_addr = arg[0]
            nic_name = arg[1]
            if dst_addr in self.ip_list:
                pass
            else:
                ip = test_arping(dst_addr, self.ping_timeout, self.count, nic_name)
                if ip:
                    self.ip_list.append(ip)
                    # else:
                    #     for port in self.ports:
                    #         port_q.put((ip, port))
            arp_q.task_done()

    def port_scan(self, port_q):
        while not port_q.empty():
            arg = port_q.get()
            dst_addr = arg[0]
            port = arg[1]
            if dst_addr in self.ip_list:
                pass
            else:
                ip = test_port(dst_addr, port, self.port_timeout)
                if ip:
                    self.ip_list.append(ip)
            port_q.task_done()

    def NetScan(self, ipPool):
        ping_q = Queue.Queue()
        arp_q = Queue.Queue()
        port_q = Queue.Queue()
        for ip in ipPool:
            ping_q.put(ip)
        for num in xrange(20):
            tp = threading.Thread(target=self.ping_scan, args=(ping_q, arp_q, port_q))
            tp.start()
        ping_q.join()
        for num in xrange(20):
            tpo = threading.Thread(target=self.port_scan, args=(port_q,))
            tpo.start()
        port_q.join()
        if sys.platform != "win32":
            for num in xrange(20):
                ta = threading.Thread(target=self.arping_scan, args=(arp_q,))
                ta.start()
            arp_q.join()
        return list(set(self.ip_list))

    def NetScan1(self, ipPool):
        ping_q = Queue.Queue()
        arp_q = Queue.Queue()
        port_q = Queue.Queue()
        for ip in ipPool:
            ping_q.put(ip)
        for num in xrange(20):
            tp = threading.Thread(target=self.ping_scan, args=(ping_q, arp_q, port_q))
            tp.start()
        ping_q.join()
        for num in xrange(20):
            tpo = threading.Thread(target=self.port_scan, args=(port_q,))
            tpo.start()
        port_q.join()
        if sys.platform != "win32":
            for num in xrange(20):
                ta = threading.Thread(target=self.arping_scan, args=(arp_q,))
                ta.start()
            arp_q.join()
        return list(set(self.ip_list))


def list_changes(lists, num):
    for o in xrange(0, len(lists), num):
        yield lists[o:o + num]


def list_to_list(lists, num):
    list_temp = []
    for i in list_changes(lists, num):
        list_temp.append(i)
    return list_temp


def ippool_list(start_ip, end_ip):
    ip_list = [str(ip) for ip in netaddr.IPRange(start_ip, end_ip)]
    numP = multiprocessing.cpu_count() * 4
    num = (len(ip_list) + numP - 1) / numP
    ipPool_list = list_to_list(ip_list, num)
    return ipPool_list


def IPNetScan(start_ip, end_ip):
    port_str = Settings.objects.get(key="ports").value.split(",")
    po = [int(i) for i in port_str]
    ippoollist = ippool_list(start_ip, end_ip)
    s = IPScan(ports=po)
    ip_list = []
    if __name__ == "home_application.helper_view":
        pool = multiprocessing.Pool(processes=multiprocessing.cpu_count())
        result = []
        for ippool in ippoollist:
            result.append(pool.apply_async(proxy, args=(s, ippool,)))
        pool.close()
        pool.join()
        for res in result:
            ip_list.extend(res.get())
    ip_list.sort(lambda x, y: cmp(''.join([i.rjust(3, '0') for i in x.split('.')]),
                                  ''.join([i.rjust(3, '0') for i in y.split('.')])))
    return ip_list


def IPNetScan1(start_ip, end_ip):
    port_str = Settings.objects.get(key="ports").value.split(",")
    po = [int(i) for i in port_str]
    ips_list = [str(ip) for ip in netaddr.IPRange(start_ip, end_ip)]
    s = IPScan(ports=po)
    ip_list = s.NetScan1(ips_list)
    ip_list.sort(lambda x, y: cmp(''.join([i.rjust(3, '0') for i in x.split('.')]),
                                  ''.join([i.rjust(3, '0') for i in y.split('.')])))
    return ip_list


# def IPNetScan2(start_ip, end_ip):
#     port_str = Settings.objects.get(key="ports").value.split(",")
#     po = [int(i) for i in port_str]
#     ips_list = [str(ip) for ip in netaddr.IPRange(start_ip, end_ip)]
#     s = IPScan(ports=po)
#     ip_list = s.NetScan2(ips_list)
#     ip_list.sort(lambda x, y: cmp(''.join([i.rjust(3, '0') for i in x.split('.')]),
#                                   ''.join([i.rjust(3, '0') for i in y.split('.')])))
#     return ip_list


def one_ip_scan(ip_addresses):
    port_str = Settings.objects.get(key="ports").value.split(",")
    po = [int(i) for i in port_str]
    s = IPScan(ports=po)
    ip_list = s.NetScan1(ip_addresses)
    return ip_list


def validate_ips(start_ip, end_ip):
    result = validate_networks(start_ip, end_ip)
    if not result["result"]:
        return result
    try:
        ip_allocation = []
        ip_all = IPs.objects.all()
        ip_apply_list = netaddr.IPRange(start_ip,end_ip)
        for u in ip_all:
            if u.start_ip in ip_apply_list or u.end_ip in ip_apply_list:
                return {"result": False, "data": [u"该网段已存在或者该网段有部分IP在其它网段内"]}
            ip_pools = netaddr.IPRange(u.start_ip, u.end_ip)
            ip_tem_list = [str(c) for c in ip_pools]
            ip_allocation += ip_tem_list
        if start_ip in ip_allocation or end_ip in ip_allocation:
            return {"result": False, "data": [u"该网段已存在或者该网段有部分IP在其它网段内"]}
        return {"result": True}
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return {"result": False, "data": [u"系统出错，请联系管理员！"]}


def validate_networks(start_ip, end_ip):
    try:
        netaddr.IPRange(start_ip, end_ip)
        return {"result": True}
    except Exception, e:
        logger.exception(e)
        return {"result": False, "data": [u"网段开始IP比结束IP大！"]}


def validate_one_ips(ips):
    ip_allocation = []
    ip_all = IPs.objects.all()
    for u in ip_all:
        ip_pools = netaddr.IPRange(u.start_ip, u.end_ip)
        ip_tem_list = [str(c) for c in ip_pools]
        ip_allocation += ip_tem_list
    ip_list = ips.split(",")
    for c in ip_list:
        if c in ip_allocation:
            return {"result": False, "data": [u"该IP已被分配"]}
    return {"result": True}


def validate_ips_exclude_self(start_ip, end_ip, ip_id):
    result = validate_networks(start_ip, end_ip)
    if not result["result"]:
        return result
    try:
        ip_allocation = []
        ip_all = IPs.objects.exclude(id=ip_id)
        for u in ip_all:
            ip_pools = netaddr.IPRange(u.start_ip, u.end_ip)
            ip_tem_list = [str(c) for c in ip_pools]
            ip_allocation += ip_tem_list
        if start_ip in ip_allocation or end_ip in ip_allocation:
            return {"result": False, "data": [u"该网段已存在或者该网段有部分IP在其它网段内"]}
        return {"result": True}
    except Exception, e:
        logger.exception(e)
        return {"result": False, "data": [u"系统出错，请联系管理员！"]}


# 扫描IP是否已分配或者已被使用、是否存在保留地址
def verify_ip_free_status(ip_list, is_scan=False, cloud_id=0):
    try:
        # 是否存在保留地址
        ip_keep_all = [i.ip for i in IPs.objects.filter(is_keep=True, is_deleted=False, cloud_id=cloud_id)]
        ip_keep = [i for i in ip_list if i in ip_keep_all]
        if ip_keep:
            # ip_keep.insert(0, u"以下IP已为保留地址：")
            return {"result": False, "data": [u"以下IP已为保留地址：%s" % ip_keep]}
        # 扫描IP是否已被分配
        ip_allocate_all = [i.ip for i in IPs.objects.filter(is_keep=False, is_deleted=False, cloud_id=cloud_id)]
        ip_allocate = [i for i in ip_list if i in ip_allocate_all]
        if ip_allocate:
            # ip_allocate.insert(0, u"以下IP已被分配：")
            return {"result": False, "data": [u"以下IP已被分配：%s" % ip_allocate]}
        # 扫描IP是否在被使用（未通过流程申请）
        if is_scan:
            v_result = one_ip_scan(ip_list)
            if v_result:
                # v_result.insert(0, u"以下IP已被使用：")
                return {"result": False, "data": [u"以下IP已被使用：%s" % v_result]}
        return {"result": True}
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.error(err_msg)
        return {"result": False, "data": [u"系统异常，请联系管理员"]}


# 管理员添加保留地址\ 已分配地址
def add_apply_keep_ips(ip_obj, username, type):
    now_time = date_now()
    try:
        is_keep = True if type == "keep" else False
        is_apply = True if type == "apply" else False
        if ip_obj["ipType"] == "00":
            ip_list = ip_obj["ips"].strip(",").split(",")
            ip_str = ip_obj["ips"].strip(",")
        else:
            ip_list = [str(ip) for ip in netaddr.IPRange(ip_obj["start_ip"], ip_obj["end_ip"])]
            ip_str = ip_obj["start_ip"] + "~" + ip_obj["end_ip"]
        obj = ""
        for i in ip_list:
            obj, result = IPs.objects.update_or_create(ip=i, cloud_id=ip_obj['cloud_id'],
                                                       ip_pool_id=ip_obj["ip_pool_id"], is_deleted=False,
                                                       defaults={
                                                           "business": ip_obj["business"],
                                                           "when_expired": ip_obj["when_expired"],
                                                           "owner": ip_obj["owner_name"],
                                                           "owner_mail": ip_obj["owner_mail"],
                                                           "created_by": username,
                                                           "modified_by": username,
                                                           "when_modified": now_time,
                                                           "when_created": now_time,
                                                           "is_keep": is_keep,
                                                           "is_apply": is_apply,
                                                           "description": ip_obj["description"],
                                                           "net_mask": ip_obj["net_mask"],
                                                           "dns": ip_obj["dns"],
                                                           "gate_way": ip_obj["gate_way"]
                                                       })

            # 自定义属性
            for j in ip_obj["attr_list"]:
                AttrValue.objects.update_or_create(ip_id=obj.id, ip_attr_id=j["id"],
                                                   defaults={
                                                       "value": j["value"]
                                                   })
        if not obj:
            return {"result": True}
        obj.ip = ip_str

        # 自定义属性
        append_data = [{"name": i["cn_name"], "value": i["value"]} for i in ip_obj["attr_list"]]
        obj.attr_obj = append_data

        # 日志记录
        log = OperationLog()
        log.create_log(None, obj, "add", username)
        del log
        return {"result": True}
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.error(err_msg)
        return {"result": False, "data": [u"系统异常，请联系管理员"]}


# 获取平台用户信息
def get_all_users(username):
    client = get_client_by_user(username)
    res = client.bk_login.get_all_users()
    if res["result"]:
        return {"result": True, "data": res["data"]}
    else:
        return {"result": False, "data": res["message"]}


# 获取模型实例
def search_inst_by_object(model_id, module_pros, username='admin'):
    kwargs = {
        "bk_obj_id": model_id,
        'fields': module_pros
    }
    client = get_client_by_user(username)
    res = client.cc.search_inst_by_object(kwargs)
    data = res.get('data', {})['info']
    if res["result"]:
        return {"result": True, "data": data}
    else:
        return {"result": False, "data": res["message"]}
