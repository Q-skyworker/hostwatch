# -*- coding: utf-8 -*-

from IPy import IP
from home_application.helper_view import *


# 云区域+ip判断是否存在
def has_ip_in_module(cloud_id, ip):
    obj = IPs.objects.filter(ip=ip, cloud_id=cloud_id, is_deleted=False)
    if obj:
        return {'result': True, 'data': obj}
    else:
        return {'result': False, 'data': ''}


# 获取某ip 的资源池id
def get_ip_pool_id(cloud_id, ip):
    pools = IPPools.objects.filter(cloud_id=cloud_id)
    for _pool in pools:
        if ip in IP(_pool.ip_net):
            return {'result': True, 'data': _pool.id}
    return {'result': False, 'data': ''}


# 模型实例与ip属性差异: 并进行 CMDB 同步
def diff_inst_ip(inst_obj, attr_list, ip_obj, username):
    result = False
    diff_data = {
        'ip': {},
    }
    ip_items = inst_obj.keys()
    ip_dict = ip_obj[0].to_dic()
    for _ip_item in ip_items:
        if inst_obj[_ip_item] != ip_dict[_ip_item]:
            result = True
            diff_data['ip'] = dict(diff_data['ip'], **{_ip_item: inst_obj[_ip_item]})
    if diff_data['ip']:
        diff_data['ip'] = dict(diff_data['ip'], **{'modified_by': username})
        ip_obj.update(**diff_data['ip'])
    ip_id = ip_obj[0].id
    for attr in attr_list:
        tmp_obj = AttrValue.objects.filter(ip_id=ip_id, ip_attr_id=attr['ip_attr_id'])
        if tmp_obj:
            if tmp_obj[0].value != attr['value']:
                result = True
                tmp_obj[0].value = attr['value']
                tmp_obj[0].save()
        else:
            result = True
            AttrValue.objects.create(**dict(attr, **{'ip_id': ip_id}))
    return result


# ip验证
def is_ip(ip):
    pattern = r'^((?:\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.){3}(?:\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$'
    if re.match(pattern, ip):
        return True
    return False


# 模型同步
class ModuleScan:
    def __init__(self, map_list, ip_pros, ip_attrs, cloud_const_flag=False, cloud_const='0', username='admin'):
        self.map_list = map_list
        self.ip_pros = ip_pros
        self.ip_attrs = ip_attrs
        self.cloud_const_flag = cloud_const_flag
        self.cloud_const = cloud_const
        self.username = username
        self.update_list = []
        self.ip_list = []
        self.no_pool_ips = []

    # 实例转成字典对象，保存数据库
    def inst_to_dict(self, inst_obj, cloud_id, ip):
        obj = {}
        attr_list = []
        inst_items = inst_obj.keys()
        for map in self.map_list:
            if map['ip_item'] != 'ip' and map['ip_item'] != 'cloud_id':
                ip_attr_id = [{"ip_attr_id": i['ip_attr_id'],
                               "value": str(inst_obj[map['model_item']]) if map['model_item'] in inst_items else ''
                               } for i in self.ip_attrs if i['name'] == map['ip_item']]
                if ip_attr_id:
                    attr_list.extend(ip_attr_id)
                else:
                    obj = dict(obj, **{
                        map['ip_item']: str(inst_obj[map['model_item']]) if map['model_item'] in inst_items else ''})
        obj = dict(obj, **{'ip': ip, 'cloud_id': cloud_id})
        return obj, attr_list

    def inst_scan(self, inst_queue):
        now_time = date_now()
        while not inst_queue.empty():
            inst_obj = inst_queue.get()
            cloud_id = self.cloud_const
            if not self.cloud_const_flag:
                cloud_id = str(inst_obj[self.cloud_const])
            for _ip_pros in self.ip_pros:
                # 获取映射属性的ip值，可能多个 逗号分隔
                if inst_obj[_ip_pros]:
                    ips = str(inst_obj[_ip_pros]).split(',')
                    for ip in ips:
                        ip = ip.strip()
                        if is_ip(ip):  # 优化 先判断池 减少判断次数
                            pool_res = get_ip_pool_id(cloud_id, ip)
                            if pool_res['result']:
                                ip_obj = has_ip_in_module(cloud_id, ip)
                                obj_dict, attr_list = self.inst_to_dict(inst_obj, cloud_id, ip)
                                if ip_obj['result']:
                                    if diff_inst_ip(obj_dict, attr_list, ip_obj['data'], self.username):
                                        self.update_list.append(ip)
                                else:
                                    # 保留IP使用状态
                                    obj_dict = dict(obj_dict, **{'ip_pool_id': pool_res['data'],
                                                                 'is_apply': False,
                                                                 'is_keep': True,
                                                                 'ip_status': '01',
                                                                 'when_created': now_time,
                                                                 'when_modified': now_time,
                                                                 'created_by': self.username,
                                                                 'modified_by': self.username
                                                                 })
                                    new_obj = IPs.objects.create(**obj_dict)
                                    AttrValue.objects.bulk_create([AttrValue(**dict(_attr, **{'ip_id': new_obj.id}))
                                                                   for _attr in attr_list])
                                    self.ip_list.append(ip)
                            else:
                                self.no_pool_ips.append(ip)
            inst_queue.task_done()

    def module_sync(self, inst_list):
        inst_queue = Queue.Queue()
        for inst in inst_list:
            if inst:
                inst_queue.put(inst)
        for num in xrange(20):
            tp = threading.Thread(target=self.inst_scan, args=(inst_queue,))
            tp.start()
        inst_queue.join()
        return {'update_list': self.update_list, 'add_ips': self.ip_list, 'no_sync_ips': self.no_pool_ips}


# 模型同步
def SyncModule_IP(model_id, map_list, ip_attrs, username):
    module_pros = []
    cloud_constant = '0'
    cloud_const_flag = False
    ip_pros = []
    for map in map_list:
        if map['ip_item'] == 'ip':
            ip_pros = [i for i in map['model_item'].split(',')]
            module_pros.extend(ip_pros)
        elif map['ip_item'] == 'cloud_id':
            if re.match(r'CONSTANT:\d', map['model_item']):
                cloud_constant = map['model_item'].split(':')[1]
                cloud_const_flag = True
            else:
                cloud_constant = map['model_item']
                module_pros.append(cloud_constant)
        else:
            module_pros.append(map['model_item'])
    search_res = search_inst_by_object(model_id, module_pros, username)
    #return render_json(search_res)
    if search_res['result']:
        m_scan = ModuleScan(map_list, ip_pros, ip_attrs, cloud_const_flag, cloud_constant, username)
        res = m_scan.module_sync(search_res['data'])
        return {"result": True, "data": res}
    else:
        logger.error(json.dumps(search_res))
        return {"result": False}

