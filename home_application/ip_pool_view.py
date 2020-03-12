# -*-encoding=utf-8 -*-

from common.mymako import render_json
from IPy import IP
from home_application.models import IPPools, IPs, OperationLog, PoolAttrValue, IPAttr
import json
from common.log import logger
import netaddr

SYS_ERROR = {"result": False, "data": ["系统异常，请联系管理员！"]}


def get_is_ip_overlaps(ip_net, cloud_id=0, ip_pool_id=None):
    net_list = IPPools.objects.filter(cloud_id=cloud_id).exclude(id=ip_pool_id).values("ip_net")
    for i in net_list:
        if IP(ip_net).overlaps(i["ip_net"]):
            return True
    return False


def get_has_ip_used(ip_pool_obj):
    ip_list = IPs.objects.filter(ip_pool_id=ip_pool_obj["id"], is_deleted=False)
    if ip_list.exists():
        return True
    else:
        return False


def create_ip_pool(request):
    try:
        obj = json.loads(request.body)
        obj["created_by"] = request.user.username

        # 判断名称、网段是否存在重复
        old_obj = IPPools.objects.filter(title=obj["title"], created_by=obj["created_by"])
        if old_obj.exists():
            return render_json({"result": False, "data": [u"名称重复"]})
        if get_is_ip_overlaps(ip_net=obj["ip_net"], cloud_id=obj["cloud_id"]):
            return render_json({"result": False, "data": [u"存在重叠IP"]})

        # 资源池数据
        obj["used_count"] = 0
        ips = IP(obj["ip_net"])
        obj["all_count"] = ips.len()
        obj["ip_start"] = str(ips[0])
        obj["ip_end"] = str(ips[-1])
        obj["net_mask"] = ips.strNetmask()

        # 创建资源池
        ip_pool = IPPools()
        ip_pool.create_item(obj)
        pool_obj = IPPools.objects.get(ip_net=obj["ip_net"], cloud_id=obj["cloud_id"], title=obj["title"],
                                       created_by=obj["created_by"])

        # 自定项属性项
        attr_value_obj = [PoolAttrValue(value=i["value"], pool=pool_obj, pool_attr_id=i["id"]) for i in
                          obj["attr_list"]]
        PoolAttrValue.objects.bulk_create(attr_value_obj)
        append_data = [{"name": i.pool_attr.cn_name, "value": i.value} for i in attr_value_obj]
        pool_obj.attr_obj = append_data

        # 日志记录
        log = OperationLog()
        log.create_log(None, pool_obj, 'add', request.user.username)
        del log

        return_data = pool_obj.to_dic()
        return_data["keep_count"] = IPs.objects.filter(ip_pool_id=return_data["id"], is_keep=True, is_deleted=False).count()
        return_data["apply_count"] = IPs.objects.filter(ip_pool_id=return_data["id"], is_keep=False, is_deleted=False).count()
        return render_json({"result": True, "data": return_data})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统异常，请联系管理员"]})


def modify_ip_pool(request):
    try:
        obj = json.loads(request.body)
        obj["modified_by"] = request.user.username
        old_pool = IPPools.objects.get(id=obj["id"])
        if obj["ip_net"] != old_pool.ip_net:
            if get_is_ip_overlaps(obj["ip_net"], obj["id"]):
                return render_json({"result": False, "data": [u"存在重叠IP"]})
            if get_has_ip_used(obj):
                return render_json({"result": False, "data": [u"部分IP已被分配，无法修改"]})
            obj["all_count"] = IP(obj["ip_net"]).len()
            ips = IP(obj["ip_net"])
            obj["ip_start"] = str(ips[0])
            obj["ip_end"] = str(ips[-1])
        else:
            obj["allcount"] = old_pool.all_count
            obj["ip_start"] = old_pool.ip_start
            obj["ip_end"] = old_pool.ip_end
            obj["used_count"] = old_pool.used_count
        old_modal = IPPools.objects.get(id=obj["id"])
        old_modal.modify_item(obj)
        new_pool = IPPools.objects.get(id=obj["id"])
        log = OperationLog()
        log.create_log(old_pool, new_pool, 'update', request.user.username)
        del log
        return render_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统异常，请联系管理员"]})


# 以ID删除
def delete_ip_pool(request):
    try:
        obj = json.loads(request.body)
        if get_has_ip_used(obj):
            return render_json({"result": False, "data": [u"部分IP已被分配，无法删除"]})
        pool_obj = IPPools.objects.get(id=obj["id"])
        append_data = []
        attr_obj = IPAttr.objects.filter(attr_type="pool")
        for one_obj in attr_obj:
            attr_value_obj = PoolAttrValue.objects.filter(pool_id=obj["id"], pool_attr_id=one_obj.id)
            if attr_value_obj.exists():
                append_data.append({"name": one_obj.cn_name, "value": attr_value_obj[0].value})
            else:
                append_data.append({"name": one_obj.cn_name, "value": ""})
        pool_obj.attr_obj = append_data
        IPPools.objects.filter(id=obj["id"]).delete()
        log = OperationLog()
        log.create_log(pool_obj, None, "delete", request.user.username)
        del log
        return render_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json(SYS_ERROR)


def get_ip_pools(request):
    try:
        pool_list = IPPools.objects.all()
        return render_json({"result": True, "data": [{"id": i.id, "text": i.title + "(" + i.ip_net + ")"} for i in pool_list]})
    except Exception, e:
        logger.exception(e)
        return render_json(SYS_ERROR)


def search_ip_pools(request):
    try:
        filter_obj = eval(request.body)
        pool_list = IPPools.objects.filter(title__icontains=filter_obj["title"]).values()
        for i in pool_list:
            i["keep_count"] = IPs.objects.filter(ip_pool_id=i["id"], is_keep=True, is_deleted=False).count()
            i["apply_count"] = IPs.objects.filter(ip_pool_id=i["id"], is_keep=False, is_deleted=False).count()
        return render_json({"result": True, "data": list(pool_list)})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json(SYS_ERROR)


# 查询资源池自定义属性值
def get_pool_attr_value(request):
    try:
        filter_obj = json.loads(request.body)
        attr_obj = IPAttr.objects.filter(attr_type="pool")
        return_data = []

        # 已设置自定属性值和未设置属性
        for one_obj in attr_obj:
            attr_value_obj = PoolAttrValue.objects.filter(pool_id=filter_obj["id"], pool_attr=one_obj)
            if attr_value_obj.exists():
                return_data.append(
                    {"value_id": attr_value_obj[0].id, "pool_id": attr_value_obj[0].pool.id, "attr_id": one_obj.id,
                     "value": attr_value_obj[0].value, "cn_name": one_obj.cn_name, "name": one_obj.name,
                     "is_required": one_obj.is_required})
            else:
                return_data.append(
                    {"value_id": "", "pool_id": filter_obj["id"], "attr_id": one_obj.id,
                     "value": "", "cn_name": one_obj.cn_name, "name": one_obj.name,
                     "is_required": one_obj.is_required})
        return render_json({"result": True, "data": return_data})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"获取自定义属性信息失败", u"失败原因：%s" % err_msg]})


# 编辑修改资源池
def modify_pool_obj(request):
    try:
        obj = json.loads(request.body)
        obj["modified_by"] = request.user.username
        old_pool = IPPools.objects.get(id=obj["id"])

        # 资源池数据处理
        if obj["ip_net"] != old_pool.ip_net or obj["cloud_id"] != old_pool.cloud_id:
            if get_is_ip_overlaps(obj["ip_net"], obj["cloud_id"], obj["id"]):
                return render_json({"result": False, "data": [u"存在重叠IP"]})
            if get_has_ip_used(obj):
                return render_json({"result": False, "data": [u"部分IP已被分配，无法修改"]})
            ips = IP(obj["ip_net"])
            obj["all_count"] = ips.len()
            obj["ip_start"] = str(ips[0])
            obj["ip_end"] = str(ips[-1])
            obj["net_mask"] = ips.strNetmask()
        else:
            obj["allcount"] = old_pool.all_count
            obj["ip_start"] = old_pool.ip_start
            obj["ip_end"] = old_pool.ip_end
            obj["used_count"] = old_pool.used_count

        # 资源池修改
        old_modal = IPPools.objects.get(id=obj["id"])
        old_modal.modify_item(obj)
        new_pool = IPPools.objects.get(id=obj["id"])

        # 自定义属性修改
        append_data = []
        for i in obj["attrObj"]:
            if not i["value_id"]:
                attr_value_obj = PoolAttrValue.objects.create(pool_id=i["pool_id"], pool_attr_id=i["attr_id"],
                                                              value=i["value"])
                append_data.append({"value_id": attr_value_obj.id, "pool_id": i["pool_id"], "attr_id": i["attr_id"],
                                    "value": "", "cn_name": i["cn_name"], "name": i["name"],
                                    "is_required": i["is_required"]})
            else:
                old_attr = PoolAttrValue.objects.filter(id=i["value_id"])
                append_data.append(
                    {"value_id": old_attr[0].id, "pool_id": old_attr[0].pool.id, "attr_id": old_attr[0].pool_attr.id,
                     "value": old_attr[0].value, "cn_name": old_attr[0].pool_attr.cn_name,
                     "name": old_attr[0].pool_attr.name, "is_required": old_attr[0].pool_attr.is_required})
                PoolAttrValue.objects.filter(id=i["value_id"]).update(value=i["value"])
        old_pool.attr_obj = append_data

        log = OperationLog()
        log.create_log(old_pool, new_pool, 'update', request.user.username)
        del log
        return render_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统异常，请联系管理员"]})