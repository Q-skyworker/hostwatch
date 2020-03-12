controllers.controller("sysManagementCtrl", function ($scope, errorModal, $modal, loading, confirmModal, sysService, msgModal) {
    $scope.args = {
        poolWarn: "",
        recycleDay: "",
        ipWarnDay: ""
    };
    $scope.isModify = false;
    $scope.setting_init = {};
    $scope.searchSetting = function () {
        loading.open();
        sysService.get_sys_setting({}, {}, function (res) {
            loading.close();
            if (res.result) {
                $scope.args.poolWarn = res.data.POOL_WARN;
                $scope.args.recycleDay = res.data.RECYCLE_DAY;
                $scope.args.ipWarnDay = res.data.IP_WARN_DAY;
                $scope.setting_init = angular.copy($scope.args)
            }
        })
    };
    $scope.searchSetting();

    $scope.modifySettings = function (res) {
        $scope.isModify = true;

    };

    $scope.confirm = function () {
        var errors = [];
        if ($scope.args.poolWarn === "") {
            errors.push("资源池告警阀值不能为空")
        }
        if ($scope.args.poolWarn <= 0 || $scope.args.poolWarn >= 100) {
            errors.push("资源池告警阀值范围：0-100")
        }
        if ($scope.args.ipWarnDay === "") {
            errors.push("IP即将到期邮件提醒(天)不能为空")
        }
        if ($scope.args.recycleDay === "") {
            errors.push("IP释放预留时间不能为空")
        }
        if (errors.length > 0) {
            errorModal.open(errors);
            return;
        }
        loading.open();
        sysService.modify_sys_setting({}, $scope.args, function (res) {
            loading.close();
            if (res.result) {
                msgModal.open("success", "修改成功");
                $scope.isModify = false;
                $scope.setting_init = angular.copy($scope.args)
            } else {
                errorModal.open(res.data);
            }
        })
    };

    $scope.cancel = function () {
        $scope.isModify = false;
        $scope.args = angular.copy($scope.setting_init);
    };

    $scope.upload_img = function () {
        var fd = new FormData();
        var files = $("#uploadFile").get(0).files;
        var error_list = test_error(files);
        if (error_list.length > 0) {
            errorModal.open(error_list);
            return
        }
        fd.append("upfile", $("#uploadFile").get(0).files[0]);
        loading.open();
        $.ajax({
            url: site_url + "upload_img/",
            type: "POST",
            processData: false,
            contentType: false,
            data: fd,
            success: function (res) {
                loading.close();
                if (res.result) {
                    msgModal.open("success", "上传成功");
                    window.location.reload();
                } else {
                    errorModal.open(res.data);

                }
            }
        });
    };

    var test_error = function (files) {
        var file_type = files[0].type;
        var file_size = files[0].size / 1024;
        var error_list = [];
        if (file_type != "image/png" && file_type != 'image/jpeg') {
            error_list.push("只允许png,jpg,jpeg格式的图片!");
        }
        if (file_size > 500) {
            error_list.push("请保证文件小于500K!");
        }
        return error_list;
    };

    $scope.setDefaultImg = function () {
        loading.open();
        sysService.set_default_img({}, {}, function (res) {
            loading.close();
            if (res.result) {
                msgModal.open("success", "修改成功");
                window.location.reload();
            }
        })
    }
});



