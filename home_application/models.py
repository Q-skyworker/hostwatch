# -*- coding: utf-8 -*-

from django.db import models
import datetime

Type = {
    True: '是',
    False: "否"
}


class IPPools(models.Model):
    ip_start = models.CharField(max_length=50)
    ip_end = models.CharField(max_length=50)
    cloud_id = models.CharField(max_length=10, default="0")
    when_created = models.CharField(max_length=30)
    when_modified = models.CharField(max_length=30, default="")
    created_by = models.CharField(max_length=100)
    modified_by = models.CharField(max_length=100, default="")
    ip_net = models.CharField(max_length=100)
    title = models.CharField(max_length=100)
    all_count = models.IntegerField()
    used_count = models.IntegerField()
    net_mask = models.CharField(max_length=50, default="")  # 子网掩码
    gate_way = models.CharField(max_length=50, default="")  # 网关
    dns = models.CharField(max_length=50, default="")  # DNS

    def to_dic(self):
        return dict([(attr, getattr(self, attr)) for attr in [f.name for f in self._meta.fields]])

    def create_item(self, dict_item):
        self.ip_start = dict_item["ip_start"]
        self.ip_end = dict_item["ip_end"]
        self.cloud_id = dict_item['cloud_id']
        self.created_by = dict_item["created_by"]
        self.title = dict_item["title"]
        self.ip_net = dict_item["ip_net"]
        self.all_count = dict_item["all_count"]
        self.used_count = dict_item["used_count"]
        self.net_mask = dict_item["net_mask"]
        self.gate_way = dict_item["gate_way"]
        self.dns = dict_item["dns"]
        self.when_created = str(datetime.datetime.now()).split(".")[0]
        self.save()

    def modify_item(self, dict_item):
        self.ip_start = dict_item["ip_start"]
        self.ip_end = dict_item["ip_end"]
        self.cloud_id = dict_item['cloud_id']
        self.modified_by = dict_item["modified_by"]
        self.title = dict_item["title"]
        self.ip_net = dict_item["ip_net"]
        self.all_count = dict_item["all_count"]
        self.used_count = dict_item["used_count"]
        self.net_mask = dict_item["net_mask"]
        self.gate_way = dict_item["gate_way"]
        self.dns = dict_item["dns"]
        self.when_modified = str(datetime.datetime.now()).split(".")[0]
        self.save()

    class Meta:
        verbose_name = "资源池管理"

    @property
    def get_key_items(self):
        return [
            {"key": "{0}.title", "name": "名称", "order": 1},
            {"key": "{0}.ip_net", "name": "网段", "order": 2},
            {"key": "{0}.cloud_id", "name": "云区域", "order": 3},
            {"key": "{0}.gate_way", "name": "默认网关", "order": 4},
            {"key": "{0}.dns", "name": "DNS服务器", "order": 5},
        ]

    def get_summary_title(self):
        return '网段[{0}]'.format(self.ip_net)

    def get_add_operate_detail(self):
        detail = []
        item_list = self.get_key_items
        item_list.sort(lambda x, y: cmp(x["order"], y["order"]))
        for i in item_list:
            detail.append({"name": i["name"], "value": eval(i["key"].format("self")), "is_list": False})
        pool_dict = self.__dict__
        if "attr_obj" in pool_dict.keys():
            for j in pool_dict["attr_obj"]:
                detail.append({"name": j["name"], "value": j["value"]})
        return detail

    def get_update_operate_detail(self, old_model):
        detail = []
        item_list = self.get_key_items
        item_list.sort(lambda x, y: cmp(x["order"], y["order"]))
        for i in item_list:
            new_value = eval(i["key"].format("self"))
            old_value = eval(i["key"].format("old_model"))
            if old_value != new_value:
                value = "[{0}] ==> [{1}]".format(old_value, new_value)
                detail.append({"name": i["name"], "value": value, "is_list": False})
        attr_value_obj = PoolAttrValue.objects.filter(pool_id=self.id)
        for m in attr_value_obj:
            for n in old_model.attr_obj:
                if m.id == n["value_id"] and m.value != n["value"]:
                    detail.append(
                        {"name": n["cn_name"], "value": "[%s] ==> [%s]" % (n["value"], m.value), "is_list": False})
        return detail


class Apply(models.Model):
    apply_num = models.CharField(max_length=20)
    email = models.CharField(max_length=100, default="")
    when_created = models.CharField(max_length=20)
    when_expired = models.CharField(max_length=20)
    ip_list = models.TextField()
    cloud_id = models.CharField(max_length=10, default="0")
    # 申請類型：00表示IP申請，01表示續約申請
    apply_type = models.CharField(max_length=10, default="00")

    # IP 类型：00表示IP，01表示网段
    ip_type = models.CharField(max_length=10)
    created_by = models.CharField(max_length=100)
    business = models.CharField(max_length=200)
    approved_by = models.CharField(max_length=100, default="", null=True)
    when_approved = models.CharField(max_length=20, default="", null=True)
    apply_reason = models.CharField(max_length=200)
    refuse_reason = models.CharField(max_length=200, default="", null=True)
    description = models.CharField(max_length=200, default="", null=True)
    ip_pool = models.ForeignKey(IPPools, null=True)
    # 申请单状态：00表示已提交；01表示已通过；02表示被拒绝；03表示保存
    status = models.CharField(max_length=10, default="00")
    is_deleted = models.BooleanField(default=False)
    net_mask = models.CharField(max_length=50, default="")  # 子网掩码
    gate_way = models.CharField(max_length=50, default="")  # 网关
    dns = models.CharField(max_length=50, default="")  # DNS

    def to_dic(self):
        return_data = dict(
            [(attr, getattr(self, attr)) for attr in [f.name for f in self._meta.fields if f.name != "ip_pool"]])
        return_data["ip_pool"] = self.ip_pool.to_dic() if self.apply_type == "00" else {}
        return_data["ip_pool_name"] = (
                self.ip_pool.title + "(" + self.ip_pool.ip_net + ")") if self.apply_type == "00" else ""
        return return_data

    class Meta:
        verbose_name = "IP申请管理"

    @property
    def get_key_items(self):
        if self.apply_type == "01":
            return [
                {"key": "{0}.apply_type", "name": "申请类型", "order": 1},
                {"key": "{0}.apply_num", "name": "申请单号", "order": 2},
                {"key": "{0}.created_by", "name": "申请人", "order": 3},
                {"key": "{0}.when_created", "name": "申请时间", "order": 4},
                {"key": "{0}.ip_list", "name": "IP", "order": 5},
                {"key": "{0}.cloud_id", "name": "云区域", "order": 6},
                # {"key": "{0}.net_mask", "name": "子网掩码", "order": 6},
                # {"key": "{0}.gate_way", "name": "网关", "order": 7},
                # {"key": "{0}.dns", "name": "DNS服务器", "order": 8},
                {"key": "{0}.when_expired", "name": "过期时间", "order": 9},
                {"key": "{0}.email", "name": "邮箱", "order": 10},
                {"key": "{0}.apply_reason", "name": "申请理由", "order": 11},
            ]
        else:
            return [
                {"key": "{0}.apply_type", "name": "申请类型", "order": 1},
                {"key": "{0}.apply_num", "name": "申请单号", "order": 2},
                {"key": "{0}.created_by", "name": "申请人", "order": 3},
                {"key": "{0}.when_created", "name": "申请时间", "order": 4},
                {"key": "{0}.ip_pool.ip_net", "name": "IP资源池", "order": 5},
                {"key": "{0}.ip_list", "name": "IP", "order": 6},
                {"key": "{0}.cloud_id", "name": "云区域", "order": 7},
                {"key": "{0}.net_mask", "name": "子网掩码", "order": 8},
                {"key": "{0}.gate_way", "name": "网关", "order": 9},
                {"key": "{0}.dns", "name": "DNS服务器", "order": 10},
                {"key": "{0}.business", "name": "业务系统", "order": 11},
                {"key": "{0}.when_expired", "name": "过期时间", "order": 12},
                {"key": "{0}.email", "name": "邮箱", "order": 13},
                {"key": "{0}.apply_reason", "name": "申请理由", "order": 14},
                {"key": "{0}.description", "name": "描述", "order": 15},
            ]

    def get_summary_title(self):
        if str(self.apply_type) == "01":
            return '续约申请[{0}]'.format(self.apply_num)
        else:
            return 'IP申请[{0}]'.format(self.apply_num)

    def get_add_operate_detail(self):
        detail = []
        item_list = self.get_key_items
        item_list.sort(lambda x, y: cmp(x["order"], y["order"]))
        for i in item_list:
            if i['name'] == "申请类型":
                if eval(i["key"].format("self")) == "01":
                    detail.append({"name": i['name'], "value": "续约申请", "is_list": False})
                else:
                    detail.append({"name": i['name'], "value": "IP申请", "is_list": False})
            else:
                detail.append({"name": i["name"], "value": eval(i["key"].format("self")), "is_list": False})
        temp_dict = self.__dict__
        if "attr_obj" in temp_dict.keys():
            for m in temp_dict["attr_obj"]:
                detail.append({"name": m["name"], "value": m["value"]})
        return detail

    def apply_operate_detail(self, operate_type):
        detail = []
        item_list = self.get_key_items
        item_list.sort(lambda x, y: cmp(x["order"], y["order"]))
        if operate_type == 'approve':
            item_list = [
                            {"key": "{0}.approved_by", "name": "审批人"},
                            {"key": "{0}.when_approved", "name": "审批时间"}
                        ] + item_list
        if operate_type == 'refuse':
            item_list = [
                            {"key": "{0}.approved_by", "name": "审批人"},
                            {"key": "{0}.when_approved", "name": "审批时间"},
                            {"key": "{0}.refuse_reason", "name": "拒绝原因"},
                        ] + item_list
        for i in item_list:
            if i['name'] == "申请类型":
                if eval(i["key"].format("self")) == "01":
                    detail.append({"name": i['name'], "value": "续约申请", "is_list": False})
                else:
                    detail.append({"name": i['name'], "value": "IP申请", "is_list": False})
            else:
                detail.append({"name": i["name"], "value": eval(i["key"].format("self")), "is_list": False})
        return detail

    def get_update_operate_detail(self, old_model):
        detail = []
        item_list = self.get_key_items
        item_list.sort(lambda x, y: cmp(x["order"], y["order"]))
        for i in item_list:
            new_value = eval(i["key"].format("self"))
            old_value = eval(i["key"].format("old_model"))
            if old_value != new_value:
                value = "[{0}] ==> [{1}]".format(old_value, new_value)
                detail.append({"name": i["name"], "value": value, "is_list": False})
        attr_temp_obj = AttrValueTemp.objects.filter(apply_id=self.id)
        for m in attr_temp_obj:
            for n in old_model.attr_obj:
                if m.id == n["temp_id"] and m.value != n["value"]:
                    detail.append(
                        {"name": n["cn_name"], "value": "[%s] ==> [%s]" % (n["value"], m.value), "is_list": False})
        return detail


class IPs(models.Model):
    ip = models.CharField(max_length=20)
    # 云区域ID，默认为0
    cloud_id = models.CharField(max_length=10, default="0")
    business = models.CharField(max_length=100, null=True, default="")
    when_expired = models.CharField(max_length=20)
    owner = models.CharField(max_length=100)
    owner_mail = models.CharField(max_length=50)
    is_expired = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    created_by = models.CharField(max_length=100)
    modified_by = models.CharField(max_length=100)
    when_modified = models.CharField(max_length=100)
    when_created = models.CharField(max_length=100)
    is_keep = models.BooleanField(default=False)  # 是否是保留IP
    is_apply = models.BooleanField(default=True)  # 是否通过申请流程
    # IP使用状态：00已分配；01表示使用中；02表示释放中
    ip_status = models.CharField(max_length=10, default="00")
    description = models.CharField(max_length=200, default="", null=True)
    ip_pool = models.ForeignKey(IPPools)
    net_mask = models.CharField(max_length=50, default="")  # 子网掩码
    gate_way = models.CharField(max_length=50, default="")  # 网关
    dns = models.CharField(max_length=50, default="")  # DNS

    def to_dic(self):
        return_data = dict(
            [(attr, getattr(self, attr)) for attr in [f.name for f in self._meta.fields if f.name != "ip_pool"]])
        return_data["ip_pool"] = self.ip_pool.to_dic()
        return return_data

    class Meta:
        verbose_name = "IP管理"

    @property
    def get_key_items(self):
        return_data = [
            {"key": "{0}.ip", "name": "IP地址", "order": 1},
            {"key": "{0}.cloud_id", "name": "云区域", "order": 2},
            {"key": "{0}.ip_pool.ip_net", "name": "网段", "order": 3},
            {"key": "{0}.net_mask", "name": "子网掩码", "order": 4},
            {"key": "{0}.gate_way", "name": "网关", "order": 5},
            {"key": "{0}.dns", "name": "DNS服务器", "order": 6},
            {"key": "{0}.when_expired", "name": "过期时间", "order": 7},
            {"key": "{0}.owner", "name": "管理员", "order": 8},
            {"key": "{0}.owner_mail", "name": "管理员邮箱", "order": 9},
            {"key": "{0}.created_by", "name": "审批\增加者", "order": 10},
            {"key": "{0}.when_created", "name": "审批\添加时间", "order": 11},
            {"key": "{0}.business", "name": "业务系统", "order": 12},
            {"key": "{0}.description", "name": "描述", "order": 13},
        ]
        return return_data

    def get_summary_title(self):
        if self.is_keep:
            return '保留IP\网段[{0}]'.format(self.ip)
        else:
            return '分配IP\网段[{0}]'.format(self.ip)

    def get_add_operate_detail(self):
        detail = []
        item_list = self.get_key_items
        item_list.sort(lambda x, y: cmp(x["order"], y["order"]))
        for i in item_list:
            detail.append({"name": i["name"], "value": eval(i["key"].format("self")), "is_list": False})
        if str(self.ip_status) == '00':
            ip_status = "已分配"
        elif str(self.ip_status) == '01':
            ip_status = "使用中"
        else:
            ip_status = "释放中"
        detail.append({"name": "使用状态", "value": ip_status, "is_list": False})
        # ip_dict = self.__dict__
        # if "attr_obj" in ip_dict.keys():
        #     for j in ip_dict["attr_obj"]:
        #         detail.append({"name": j["name"], "value": j["value"]})

        attr_value_obj = AttrValue.objects.filter(ip_id=self.id)
        for k in attr_value_obj:
            detail.append({"name": k.ip_attr.cn_name, "value": k.value})
        return detail

    def get_update_operate_detail(self, old_model):
        detail = []
        item_list = self.get_key_items
        item_list.sort(lambda x, y: cmp(x["order"], y["order"]))
        for i in item_list:
            new_value = eval(i["key"].format("self"))
            old_value = eval(i["key"].format("old_model"))
            if old_value != new_value:
                value = "[{0}] ==> [{1}]".format(old_value, new_value)
                detail.append({"name": i["name"], "value": value, "is_list": False})
        attr_value_obj = AttrValue.objects.filter(ip_id=self.id)
        for m in attr_value_obj:
            for n in old_model.attr_obj:
                if m.id == n["value_id"] and m.value != n["value"]:
                    detail.append(
                        {"name": n["cn_name"], "value": "[%s] ==> [%s]" % (n["value"], m.value), "is_list": False})
        return detail


# 操作日志
class OperationLog(models.Model):
    operator = models.CharField(max_length=100, null=True)
    operate_type = models.TextField(max_length=100)
    operate_detail = models.TextField(default='')
    when_created = models.CharField(null=True, max_length=100)
    operate_obj = models.CharField(max_length=100, default="")
    operate_summary = models.TextField(default='')

    @property
    def OperateType(self):
        return {"add": "新增", "update": "修改", "api": "执行", "delete": "删除", "approve": "通过", "refuse": "拒绝"}

    def to_dict(self):
        dict_obj = {
            "operator": self.operator,
            "when_created": self.when_created,
            "operate_type": self.operate_type,
            "operate_type_name": self.OperateType[self.operate_type],
            "operate_obj": self.operate_obj,
            "operate_summary": self.operate_summary,
            "operate_detail": eval(self.operate_detail)
        }
        return dict_obj

    def create_log(self, old_model, new_model, operate_type, operator):
        self.operate_type = operate_type
        self.operator = operator
        self.when_created = str(datetime.datetime.now()).split('.')[0]
        title = new_model.get_summary_title() if new_model else old_model.get_summary_title()
        self.operate_summary = self.OperateType[operate_type] + title
        self.operate_obj = new_model._meta.verbose_name if new_model else old_model._meta.verbose_name
        if operate_type == 'add':
            self.operate_detail = new_model.get_add_operate_detail()
        elif operate_type == 'update':
            self.operate_detail = new_model.get_update_operate_detail(old_model)
        elif operate_type == "delete":
            self.operate_detail = old_model.get_add_operate_detail()
        elif operate_type == 'approve' or operate_type == 'refuse':
            self.operate_detail = new_model.apply_operate_detail(operate_type)
        else:
            self.operate_detail = old_model.get_add_operate_detail()
        self.save()

    def create_setting_log(self, old_model, new_model, operate_type, operator):
        self.operate_type = operate_type
        self.operator = operator
        self.when_created = str(datetime.datetime.now()).split('.')[0]
        title = new_model.get_summary_title() if new_model else old_model.get_summary_title()
        self.operate_summary = self.OperateType[operate_type] + title
        self.operate_obj = new_model._meta.verbose_name if new_model else old_model._meta.verbose_name
        if operate_type == 'add':
            self.operate_detail = new_model.get_add_operate_detail()
        elif operate_type == 'update':
            self.operate_detail = new_model.get_update_operate_detail(old_model)
        elif operate_type == "delete":
            self.operate_detail = old_model.get_add_operate_detail()
        else:
            self.operate_detail = old_model.get_add_operate_detail()
        if not self.operate_detail:
            return
        self.save()

    def create_cmdbmodule__log(self, log_detail, operate_type, operator):
        self.operate_type = operate_type
        self.operator = operator
        self.when_created = str(datetime.datetime.now()).split('.')[0]
        title = '模型映射管理'
        self.operate_summary = self.OperateType[operate_type] + title
        self.operate_obj = 'CMDB模型管理'
        if operate_type == 'update':
            self.operate_detail = log_detail
        self.save()


class Mailboxes(models.Model):
    username = models.CharField(max_length=50)
    mailbox = models.CharField(max_length=100)
    when_created = models.CharField(max_length=30)

    def to_dic(self):
        return dict([(attr, getattr(self, attr)) for attr in [f.name for f in self._meta.fields]])

    class Meta:
        verbose_name = "邮箱管理"

    @property
    def get_key_items(self):
        return [
            {"key": "{0}.username", "name": "用户名", "order": 1},
            {"key": "{0}.mailbox", "name": "邮箱", "order": 2},
        ]

    def get_summary_title(self):
        return '邮箱[{0}]'.format(self.mailbox)

    def get_add_operate_detail(self):
        detail = []
        item_list = self.get_key_items
        item_list.sort(lambda x, y: cmp(x["order"], y["order"]))
        for i in item_list:
            detail.append({"name": i["name"], "value": eval(i["key"].format("self")), "is_list": False})
        return detail

    def get_update_operate_detail(self, old_model):
        detail = []
        item_list = self.get_key_items
        item_list.sort(lambda x, y: cmp(x["order"], y["order"]))
        for i in item_list:
            new_value = eval(i["key"].format("self"))
            old_value = eval(i["key"].format("old_model"))
            if old_value != new_value:
                value = "[{0}] ==> [{1}]".format(old_value, new_value)
                detail.append({"name": i["name"], "value": value, "is_list": False})
        return detail


class Settings(models.Model):
    key = models.CharField(max_length=50)
    value = models.TextField()
    description = models.CharField(max_length=100, null=True)

    class Meta:
        verbose_name = "系统设置"

    def to_dic(self):
        return dict([(attr, getattr(self, attr)) for attr in [f.name for f in self._meta.fields]])

    def get_summary_title(self):
        return '系统设置'

    def get_update_operate_detail(self, old_model):
        detail = []
        for i in old_model:
            old_value = {"key": i.value, "name": i.description}
            new_obj = Settings.objects.get(key=i.key)
            new_value = {"key": new_obj.value, "name": new_obj.description}
            if new_value != old_value:
                value = "[{0}] ==> [{1}]".format(old_value["key"], new_value["key"])
                detail.append({"name": i.description, "value": value, "is_list": False})
        return detail


# IP自定义属性
class IPAttr(models.Model):
    name = models.CharField(max_length=50)
    cn_name = models.CharField(max_length=50)
    created_by = models.CharField(max_length=50)
    when_created = models.CharField(max_length=30)
    modify_by = models.CharField(max_length=50)
    when_modify = models.CharField(max_length=30)
    description = models.CharField(max_length=200, default="", null=True)
    # 自定义属性类型，默认自定义IP属性，‘pool’代表资源池
    attr_type = models.CharField(max_length=50, default='ip')
    is_required = models.BooleanField(default=False)  # 是否是必填项，默认否

    def to_dic(self):
        return dict([(attr, getattr(self, attr)) for attr in [f.name for f in self._meta.fields]])

    class Meta:
        verbose_name = "IP自定义属性管理"

    @property
    def get_key_items(self):
        return [
            # {"key": "{0}.attr_type", "name": "选择类型", "order": 1},
            {"key": "{0}.name", "name": "字段名称", "order": 2},
            {"key": "{0}.cn_name", "name": "显示名称", "order": 3},
            # {"key": "{0}.is_required", "name": "是否必填项", "order": 4},
            {"key": "{0}.description", "name": "备注", "order": 5},

        ]

    def get_summary_title(self):
        return '自定义属性[{0}]'.format(self.cn_name)

    def get_add_operate_detail(self):
        detail = []
        item_list = self.get_key_items
        detail.append(
            {"name": "选择类型", "value": "IP" if str(self.attr_type) == 'ip' else "资源池", "is_list": False, 'order': 1})
        detail.append({"name": "是否必填项", "value": "是" if self.is_required else "否", "is_list": False, 'order': 4})
        item_list.sort(lambda x, y: cmp(x["order"], y["order"]))
        for i in item_list:
            detail.append({"name": i["name"], "value": eval(i["key"].format("self")), "is_list": False})
        return detail

    def get_update_operate_detail(self, old_model):
        detail = []
        item_list = self.get_key_items
        if self.is_required != old_model.is_required:
            is_required = "[{0}] ==> [{1}]".format(Type[self.is_required], Type[old_model.is_required])
            detail.append({"name": "是否必填项", "value": is_required, "is_list": False, 'order': 4})
        item_list.sort(lambda x, y: cmp(x["order"], y["order"]))
        for i in item_list:
            new_value = eval(i["key"].format("self"))
            old_value = eval(i["key"].format("old_model"))
            if old_value != new_value:
                value = "[{0}] ==> [{1}]".format(old_value, new_value)
                detail.append({"name": i["name"], "value": value, "is_list": False})
        return detail


# IP自定义项值
class AttrValue(models.Model):
    value = models.CharField(max_length=100)
    ip = models.ForeignKey(IPs)
    ip_attr = models.ForeignKey(IPAttr)

    def to_dic(self):
        return_data = dict(
            [(attr, getattr(self, attr)) for attr in
             [f.name for f in self._meta.fields if f.name != "ip" or f.name != "ip_attr"]])
        return_data["ip"] = self.ip.to_dic()
        return_data["ip_attr"] = self.ip_attr.to_dic()
        return return_data


# IP自定义项值
class PoolAttrValue(models.Model):
    value = models.CharField(max_length=100)
    pool = models.ForeignKey(IPPools)
    pool_attr = models.ForeignKey(IPAttr)

    def to_dic(self):
        return_data = dict(
            [(attr, getattr(self, attr)) for attr in
             [f.name for f in self._meta.fields if f.name != "pool" or f.name != "pool_attr"]])
        return_data["pool"] = self.pool.to_dic()
        return_data["pool_attr"] = self.pool_attr.to_dic()
        return return_data


# ip和申请单的关联表
class ApplyIP(models.Model):
    ip = models.ForeignKey(IPs)
    apply = models.ForeignKey(Apply)
    description = models.CharField(max_length=200, default="", null=True)

    def to_dic(self):
        return_data = dict([(attr, getattr(self, attr)) for attr in
                            [f.name for f in self._meta.fields if f.name != "ip" or f.name != "apply"]])
        return_data["ip"] = self.ip.to_dic()
        return_data["apply"] = self.apply.to_dic()
        return return_data


class LogoImg(models.Model):
    key = models.CharField(max_length=100)
    value = models.BinaryField()


# 申请单中自定义属性值临时表
class AttrValueTemp(models.Model):
    apply = models.ForeignKey(Apply)
    ip_attr = models.ForeignKey(IPAttr)
    value = models.CharField(max_length=100)


# CMDB模型
class CmdbModel(models.Model):
    model_id = models.CharField(u'模型标识', max_length=100)  # bk_obj_id
    model_name = models.CharField(u'模型名称', max_length=100)  # bk_obj_name
    created_by = models.CharField(max_length=100)
    when_created = models.DateTimeField(auto_now_add=True)
    level = models.IntegerField(u'同步优先级')

    def to_dic(self):
        return dict([(attr, getattr(self, attr)) for attr in [f.name for f in self._meta.fields]])

    def get_summary_title(self):
        return 'CMDB模型管理'

    class Meta:
        verbose_name = "CMDB模型管理"

    @property
    def get_key_items(self):
        return [
            {"key": "{0}.model_id", "name": "模型标识", "order": 1},
            {"key": "{0}.model_name", "name": "模型名称", "order": 2},
            {"key": "{0}.level", "name": "同步优先级", "order": 3},
        ]

    def get_add_operate_detail(self):
        detail = []
        item_list = self.get_key_items
        cmdb_model = self.modelmap_set.all()
        item_list.sort(lambda x, y: cmp(x["order"], y["order"]))
        for i in item_list:
            detail.append({"name": i["name"], "value": eval(i["key"].format("self")), "is_list": False})
        detail.append({"name": "云区域字段", "value": cmdb_model.filter(ip_item='cloud_id')[0].model_item, "is_list": False,
                       "order": 4})
        detail.append(
            {"name": "IP字段", "value": cmdb_model.filter(ip_item='ip')[0].model_item, "is_list": False, "order": 5})
        return detail


# ip 和模型映射关系
class ModelMap(models.Model):
    module = models.ForeignKey(CmdbModel)
    model_item = models.CharField(u"模型属性", max_length=100)
    ip_item = models.CharField(u"IP属性", max_length=100)

    def to_dic(self):
        return_data = dict(
            [(attr, getattr(self, attr)) for attr in [f.name for f in self._meta.fields if f.name != "module"]])
        return_data["model"] = self.module.to_dic()
        return return_data


# 同步记录
class SyncLog(models.Model):
    name = models.CharField(max_length=30)
    model_name = models.CharField(u"模型名称", max_length=100)
    created_by = models.CharField(max_length=100)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.CharField(max_length=100)
    status = models.CharField(u"状态", max_length=100, default="RUNNING")  # RUNNING、COMPLETE

    def to_dic(self):
        return {
            'id': self.id,
            'name': self.name,
            'model_name': self.model_name,
            'created_by': self.created_by,
            'start_time': self.start_time.strftime('%Y-%m-%d %H:%M:%S'),
            'end_time': self.end_time,
            'status': self.status,
        }


# 同步详情
class SyncDetail(models.Model):
    log = models.ForeignKey(SyncLog)
    ip = models.CharField(u"IP", max_length=100)
    model_name = models.CharField(u"模型名称", max_length=100)
    type = models.CharField(u"类型", max_length=100)  # add、modify

    def to_dic(self):
        return_data = dict(
            [(attr, getattr(self, attr)) for attr in [f.name for f in self._meta.fields if f.name != "log"]])
        return_data["log"] = self.log.to_dic()
        return return_data
