# -*- coding: utf-8 -*-

from common.mymako import render_json
from home_application.models import *
from home_application.celery_tasks import *
import re
from blueking.component.shortcuts import get_client_by_user
from home_application.decorator import TryException


# 获取平台模型
@TryException('search_objects')
def search_objects(request):
    username = request.user.username
    client = get_client_by_user(username)
    res = client.cc.search_objects()
    data = res.get('data', {})
    data = [{'bk_obj_id': i['bk_obj_id'], 'bk_obj_name': i['bk_obj_name']} for i in data]
    if res["result"]:
        return render_json({"result": True, "data": data})
    else:
        return render_json({"result": False, "data": res["message"]})


# 获取某模型属性字段
@TryException('search_object_attribute')
def search_object_attribute(request):
    username = request.user.username
    obj_id = request.body
    kwargs = {
        "bk_obj_id": obj_id
    }
    client = get_client_by_user(username)
    res = client.cc.search_object_attribute(kwargs)
    data = res.get('data', {})
    data = [{'id': i['bk_property_id'], 'text': i['bk_property_name'],
             'bk_obj_id': i['bk_obj_id']} for i in data]
    if res["result"]:
        return render_json({"result": True, "data": data})
    else:
        return render_json({"result": False, "data": res["message"]})


# 验证模型模型和同步优先级唯一性
def validate_module_level(request):
    res = json.loads(request.body)
    module_id = res['module_id']
    level = res['level']
    errors = []
    try:
        m_num = CmdbModel.objects.filter(model_id=module_id).count()
        if m_num > 0:
            errors.append(u'该模型已存在')

        l_num = CmdbModel.objects.filter(level=level).count()
        if l_num > 0:
            errors.append(u'不符合优先级唯一性')
        return render_json({"result": True, "data": errors})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": u"系统异常，请联系管理员！"})


# 获取地址池云区域
def get_pool_cloud(request):
    try:
        const_list = [i['cloud_id']
                      for i in IPPools.objects.filter().values('cloud_id').distinct().order_by('cloud_id')]
        return render_json({"result": True, "data": const_list})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": u"系统异常，请联系管理员！"})


# 新增模型
def add_cmdb_module(request):
    cmdb_obj = json.loads(request.body)
    username = request.user.username
    try:
        tmp_obj_cmdb = CmdbModel.objects.create(model_id=cmdb_obj['module']['bk_obj_id'],
                                                model_name=cmdb_obj['module']['bk_obj_name'],
                                                created_by=username, level=cmdb_obj['level'])
        ModelMap.objects.create(module=tmp_obj_cmdb, model_item=cmdb_obj['ip_fields'], ip_item='ip')
        cloud_id = cmdb_obj['bk_cloud_id']
        if cloud_id == '-2':
            cloud_id = 'CONSTANT:{}'.format(cmdb_obj['bk_cloud_const'])
        ModelMap.objects.create(module=tmp_obj_cmdb, model_item=cloud_id, ip_item='cloud_id')
        # 新增模型日志
        tmp_obj_cmdb.when_created = str(tmp_obj_cmdb.when_created).split('.')[0]
        log = OperationLog()
        log.create_setting_log(None, tmp_obj_cmdb, "add", username)
        del log
        return render_json({"result": True, "data": "success"})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": u"系统异常，请联系管理员！"})


# 从数据库查找模型
def search_cmdb_module(request):
    model_name = json.loads(request.body)['model_name']
    model_list = []
    try:
        cmdb_obj_list = CmdbModel.objects.filter(model_name__icontains=model_name).values()
        for item in cmdb_obj_list:
            map_list = ModelMap.objects.filter(module_id=item['id'])
            ip_fields = map_list.filter(ip_item='ip')[0].model_item
            bk_cloud_id = map_list.filter(ip_item='cloud_id')[0].model_item
            model_list.append({
                'module_id': item['id'],
                'bk_obj_name': item['model_name'],
                'bk_obj_id': item['model_id'],
                'level': item['level'],
                'bk_cloud_id': bk_cloud_id,
                'ip_fields': ip_fields
            })
        return render_json({'result': True, "data": model_list})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": u"系统异常，请联系管理员！"})


# 删除模型
def delete_cmdb_module(request):
    module_id = request.body
    try:
        del_module = CmdbModel.objects.get(model_id=module_id)
        # 模型删除日志
        del_module.when_created = str(del_module.when_created).split('.')[0]
        log = OperationLog()
        log.create_setting_log(del_module, None, "delete", request.user.username)
        del log

        del_module.delete()

        return render_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": u"系统异常，请联系管理员！"})


# 保存模型映射
def save_module_map(request):
    data = json.loads(request.body)
    module_id = data['module_id']
    module_name = data['module_name']
    map_list = data['map_list']
    log_detail = []
    try:
        module_map = ModelMap.objects.filter(module_id=module_id)
        # delete
        ip_map_list = [i['ip_pro_id'] for i in map_list]
        for _module_map in module_map:
            if _module_map.ip_item not in ip_map_list:
                _module_map.delete()
                log_detail.append({
                    "name": _module_map.ip_item,
                    "value": "[{0}] ==> [{1}]".format(_module_map.model_item, 'None'),
                    "is_list": False})
        # add和update
        for _map in map_list:
            tmp_map = module_map.filter(ip_item=_map['ip_pro_id'])
            if tmp_map:
                old_model_item = tmp_map[0].model_item
                if _map['cmdb_pro_id'] == '-2':
                    tmp_model_item = 'CONSTANT:{}'.format(_map['cmdb_cloud_constant'])
                    tmp_map.update(model_item=tmp_model_item)
                else:
                    tmp_map.update(model_item=_map['cmdb_pro_id'])
                if old_model_item != tmp_map[0].model_item:
                    log_detail.append({
                        "name": _map['ip_pro_id'],
                        "value": "[{0}] ==> [{1}]".format(old_model_item, tmp_map[0].model_item),
                        "is_list": False})
            else:
                # 云区域已建 不做判断
                ModelMap.objects.create(module_id=module_id, model_item=_map['cmdb_pro_id'], ip_item=_map['ip_pro_id'])
                log_detail.append({
                    "name": _map['ip_pro_id'],
                    "value": "[{0}] ==> [{1}]".format('None', _map['cmdb_pro_id']),
                    "is_list": False})

        # 模型映射更新日志
        if log_detail:
            log_detail = [{"name": '模型名称', "value": module_name, "is_list": False}] + log_detail
            log = OperationLog()
            log.create_cmdbmodule__log(log_detail, "update", request.user.username)
            del log

        return render_json({"result": True, "data": u"保存成功!"})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": u"系统异常，请联系管理员！"})


# 获取模型映射
def get_module_map(request):
    module_id = request.body
    try:
        ip_flags = ['id', 'is_expired', 'is_deleted', 'is_keep', 'is_apply', 'ip_status', 'ip_pool',
                    'when_created', 'when_modified', 'when_expired', 'created_by', 'modified_by']
        ip_pros = [i.name for i in IPs._meta.fields if i.name not in ip_flags]
        ip_pros += [i['name'] for i in IPAttr.objects.filter(attr_type='ip').values('name')]
        module_map = ModelMap.objects.filter(module_id=module_id)
        num = 0
        module_list = []
        for ip_item in ip_pros:
            tmp_map = module_map.filter(ip_item=ip_item)
            if tmp_map:
                is_need_map = False if ip_item != 'ip' and ip_item != 'cloud_id' else True
                model_item = tmp_map[0].model_item
                cloud_constant = '0'
                if ip_item == 'cloud_id' and re.match(r'CONSTANT:\d', model_item):
                    cloud_constant = model_item.split(':')[1]
                    model_item = '-2'
                module_list.append({
                    'id': num,
                    'ip_pro_id': ip_item,
                    'cmdb_pro_id': model_item,
                    'cmdb_cloud_constant': cloud_constant,
                    # 是否为必须映射
                    'is_NeedMap': is_need_map
                })
                num += 1
                if num == module_map.count():
                    break
        return render_json({'result': True, 'module_list': module_list, 'ip_pros': ip_pros})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": u"系统异常，请联系管理员！"})


# CMDB模型同步
def sync_cmdbmodule_manual(request):
    module_obj = json.loads(request.body)
    username = request.user.username
    try:
        ip_attrs = [{'ip_attr_id': i.id, 'name': i.name} for i in IPAttr.objects.filter(attr_type='ip')]
        task_name = '手动任务_{}'.format(timezone.now().strftime("%Y%m%d%H%M%S"))
        new_sync_log = SyncLog.objects.create(name=task_name, model_name=module_obj['bk_obj_name'],
                                              created_by=username, status='RUNNING')
        sync_one_module_ip.delay(module_obj, username, ip_attrs, new_sync_log)
        log = OperationLog()
        log.create_setting_log(CmdbModel.objects.get(id=module_obj['module_id']), None, "api", request.user.username)
        del log
        return render_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统异常，请联系管理员"]})


# 同步记录查询
def search_sync_log(request):
    filter_obj = json.loads(request.body)
    try:
        start_time_from = datetime.datetime.strptime(
            "{} 00:00:00".format(filter_obj['start_time_from']), "%Y-%m-%d %H:%M:%S")
        start_time_to = datetime.datetime.strptime(
            "{} 23:59:59".format(filter_obj['start_time_to']), "%Y-%m-%d %H:%M:%S")
        if filter_obj['model_name'] == '全部':
            sync_list = [i.to_dic() for i in SyncLog.objects.filter(name__icontains=filter_obj['task_name'],
                                                                    status__icontains=filter_obj['status'],
                                                                    start_time__range=(start_time_from, start_time_to)
                                                                    ).order_by('-id')]
        else:
            sync_list = [i.to_dic() for i in SyncLog.objects.filter(name__icontains=filter_obj['task_name'],
                                                                    model_name=filter_obj['model_name'],
                                                                    status__icontains=filter_obj['status'],
                                                                    start_time__range=(start_time_from, start_time_to)
                                                                    ).order_by('-id')]
        return render_json({'result': True, 'data': sync_list})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": u"系统异常，请联系管理员！"})


# 同步日志详细查询
def search_sync_detail(request):
    sync_log_id = request.body
    try:
        sync_log_detail = [i.to_dic() for i in SyncDetail.objects.filter(log_id=sync_log_id)]
        return render_json({"result": True, "data": sync_log_detail})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": u"系统异常，请联系管理员！"})
