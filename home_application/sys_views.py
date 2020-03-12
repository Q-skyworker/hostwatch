# -*- coding: utf-8 -*-

from common.mymako import render_json
from home_application.models import *
from home_application.celery_tasks import *
import datetime
import json
from conf.default import IMG_FILE
from django.http import HttpResponse
from home_application.decorator import TryException


# from models import *

def add_mail(request):
    args = eval(request.body)
    arr = []
    now = str(datetime.datetime.now()).split('.')[0]
    try:
        now = str(datetime.datetime.now()).split('.')[0]
        for i in args:
            mail_obj, is_add = Mailboxes.objects.get_or_create(username=i['user_name'],
                                                               defaults={
                                                                   "mailbox": i["email"],
                                                                   "when_created": now
                                                               })
            if is_add:
                log = OperationLog()
                log.create_log(None, mail_obj, 'add', request.user.username)
                del log
                arr.append(mail_obj.to_dic())
        return render_json({'result': True, "data": arr})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(e)
        return render_json({"result": False, "data": err_msg})


def modify_mail(request):
    args = eval(request.body)
    mail_id = args["id"]
    username = args["username"]
    mailbox = args["mailbox"]
    try:
        # now = str(datetime.datetime.now()).split('.')[0]
        mail = Mailboxes.objects.filter(mailbox=mailbox).exclude(id=mail_id)
        if len(mail) == 1:
            return render_json({"result": False, "data": "此邮箱账号已存在"})
        mail_obj = Mailboxes.objects.get(id=mail_id)
        old_mailbox = mail_obj.mailbox
        mail_obj.username = username
        mail_obj.mailbox = mailbox
        mail_obj.save()
        # insert_log(u"邮箱管理", request.user.username, u"修改邮箱：%s ==> %s" % (old_mailbox, mailbox))
        return render_json({'result': True, "data": mail_obj.to_dic()})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": err_msg})


def delete_mail(request):
    mail_id = request.GET["id"]
    try:
        mail_delete = Mailboxes.objects.get(id=mail_id)
        log = OperationLog()
        log.create_log(mail_delete, None, 'delete', request.user.username)
        mail_delete.delete()
        return render_json({'result': True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": err_msg})


def search_mail(request):
    args = eval(request.body)
    username = args["username"]
    mailbox = args["mailbox"]
    try:
        result = Mailboxes.objects.filter(username__icontains=username, mailbox__icontains=mailbox).order_by(
            "-when_created")
        return_data = [i.to_dic() for i in result]
        return render_json({"result": True, "data": return_data})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": err_msg})


@TryException('search_log')
def search_log(request):
    filter_obj = json.loads(request.body)
    filter_obj["operateType"] = filter_obj["operateType"] if filter_obj["operateType"] != '00' else ""
    logs = OperationLog.objects.filter(
        when_created__range=(str(filter_obj["whenStart"]) + " 00:00:00", str(filter_obj["whenEnd"]) + " 23:59:59"),
        operate_type__icontains=filter_obj["operateType"],
        operator__icontains=filter_obj["operator"]
    ).order_by("-id")
    return render_json({"result": True, "data": [i.to_dict() for i in logs]})


# 获取系统设置信息
@TryException('get_sys_setting')
def get_sys_setting(request):
    sys_obj = Settings.objects.all()
    return_data = {i.key: i.value for i in sys_obj}
    return render_json({"result": True, "data": return_data})


# 修改系统设置信息
def modify_sys_setting(request):
    username = request.user.username
    modify_obj = json.loads(request.body)
    try:
        old_module = [Settings.objects.get(key=i) for i in ["POOL_WARN", "RECYCLE_DAY", "IP_WARN_DAY"]]
        Settings.objects.filter(key="POOL_WARN").update(value=modify_obj["poolWarn"])
        Settings.objects.filter(key="RECYCLE_DAY").update(value=modify_obj["recycleDay"])
        Settings.objects.filter(key="IP_WARN_DAY").update(value=modify_obj["ipWarnDay"])
        new_module = Settings.objects.get(id=1)
        log = OperationLog()
        log.create_setting_log(old_module, new_module, "update", username)
        del log
        return render_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统异常，请联系管理员！"]})


# 搜索查询IP自定义字段
def search_custom_attr(request):
    filter_obj = json.loads(request.body)
    try:
        attr_obj = IPAttr.objects.filter(name__icontains=filter_obj["name"], cn_name__icontains=filter_obj["cn_name"],
                                         created_by__icontains=filter_obj["created_by"])
        if filter_obj["attr_type"]:
            attr_obj = attr_obj.filter(attr_type=filter_obj["attr_type"])
        return_data = [i.to_dic() for i in attr_obj]
        return render_json({"result": True, "data": return_data})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统异常，请联系管理员！"]})


# 添加IP自定义字段
def add_custom_attr(request):
    filter_obj = json.loads(request.body)
    now_time = date_now()
    username = request.user.username
    try:
        custom_obj = IPAttr.objects.filter(name=filter_obj["name"], attr_type=filter_obj["attr_type"])
        if custom_obj:
            return render_json({"result": False, "data": [u"字段名称已存在"]})
        custom_obj = IPAttr.objects.filter(cn_name=filter_obj["cn_name"], attr_type=filter_obj["attr_type"])
        if custom_obj:
            return render_json({"result": False, "data": [u"显示名称已存在"]})
        custom_obj = IPAttr.objects.create(name=filter_obj["name"], cn_name=filter_obj["cn_name"],
                                           created_by=username, when_created=now_time,
                                           modify_by=username, when_modify=now_time,
                                           description=filter_obj["description"],
                                           is_required=filter_obj["is_required"],
                                           attr_type=filter_obj["attr_type"])
        log = OperationLog()
        log.create_log(None, custom_obj, "add", username)
        del log
        return render_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统异常，请联系管理员！"]})


# 删除IP自定义属性
def delete_custom_attr(request):
    try:
        custom_id = eval(request.GET["id"])
        custom_obj = IPAttr.objects.get(id=custom_id)
        custom_obj.delete()
        log = OperationLog()
        log.create_log(custom_obj, None, "delete", request.user.username)
        return render_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统异常，请联系管理员！"]})


# 获取某个IP自定义属性
def get_custom_attr(request):
    try:
        custom_id = eval(request.GET["id"])
        custom_obj = IPAttr.objects.get(id=custom_id)
        return render_json({"result": True, "data": custom_obj.to_dic()})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统异常，请联系管理员！"]})


# 修改某个IP自定义属性
def modify_custom_attr(request):
    filter_obj = json.loads(request.body)
    username = request.user.username
    now_time = date_now()
    try:
        custom_obj = IPAttr.objects.filter(name=filter_obj["name"], attr_type=filter_obj["attr_type"]).exclude(
            id=filter_obj["id"])
        if custom_obj:
            return render_json({"result": False, "data": [u"字段名称已存在"]})
        custom_obj = IPAttr.objects.filter(name=filter_obj["cn_name"], attr_type=filter_obj["attr_type"]).exclude(
            id=filter_obj["id"])
        if custom_obj:
            return render_json({"result": False, "data": [u"显示名称已存在"]})
        old_module = IPAttr.objects.get(id=filter_obj["id"])

        IPAttr.objects.filter(id=filter_obj["id"]).update(name=filter_obj["name"], cn_name=filter_obj["cn_name"],
                                                          description=filter_obj["description"],
                                                          modify_by=username, when_modify=now_time,
                                                          is_required=filter_obj["is_required"])
        new_module = IPAttr.objects.get(id=filter_obj["id"])
        log = OperationLog()
        log.create_log(old_module, new_module, "update", username)
        del log
        return render_json({"result": True})
    except Exception, e:
        err_msg = e.message if e.message else str(e)
        logger.exception(err_msg)
        return render_json({"result": False, "data": [u"系统异常，请联系管理员！"]})


def upload_img(request):
    try:
        file_img = request.FILES['upfile']
        content = file_img.read()
        LogoImg.objects.filter(key="logo").update(value=content)
        detail = [{'is_list': False, 'name': 'LOGO设置', 'value': '修改Logo'}]
        OperationLog.objects.create(operator=request.user.username, operate_type="update", operate_detail=detail,
                                    operate_obj="LOGO设置", operate_summary="修改Logo",
                                    when_created=datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        return render_json({"result": True})
    except Exception, e:
        logger.exception(e)
        return render_json({"result": False, "data": [u"系统异常，请联系管理员！"]})


def show_logo(request):
    try:
        file_one = open(IMG_FILE, "rb")
        logo_obj, _ = LogoImg.objects.get_or_create(key="logo", defaults={"value": file_one.read()})
        file_one.close()
        photo_data = logo_obj.value
        response = HttpResponse(logo_obj.value, content_type='image/png')
        response['Content-Length'] = len(photo_data)
        return response
    except Exception, e:
        logger.error(e)


@TryException('set_default_img')
def set_default_img(request):
    LogoImg.objects.filter(key="logo").delete()
    detail = [{'is_list': False, 'name': 'LOGO设置', 'value': '恢复默认Logo'}]
    OperationLog.objects.create(operator=request.user.username, operate_type="update", operate_detail=detail,
                                operate_obj="LOGO设置", operate_summary="恢复默认Logo",
                                when_created=datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    return render_json({"result": True})
