controllers.controller("renewalApplyCtrl", ["$scope", "$filter", "loading", "errorModal", "$modalInstance",
    "applyService", "msgModal", function ($scope, $filter, loading, errorModal,
                                          $modalInstance, applyService, msgModal) {
        $scope.title = "续约申请";
        $scope.flag = false;
        $scope.isShow = false;
        var date_now = new Date();
        $scope.DateStart = date_now.setDate(date_now.getDate() + 30);
        $scope.applyObj = {
            ip_type: "00",
            ips: "",
            cloud_id: "",
            start_ip: "",
            end_ip: "",
            when_expired: $filter('date')($scope.DateStart, 'yyyy-MM-dd'),
            apply_reason: "",
            email: current_email,
            status: "00"
        };

        $scope.save = function () {
            $scope.applyObj.status = "03";
            loading.open();
            applyService.new_renewal_apply_obj({}, $scope.applyObj, function (res) {
                loading.close();
                if (res.result) {
                    msgModal.open("success", "保存成功");
                    $modalInstance.close();
                } else {
                    errorModal.open(res.data);
                }
            })
        };
        $scope.is_submit = false
        $scope.commit = function () {
            $scope.applyObj.status = "00";
            $scope.is_submit = true
            var errors = validate($scope.applyObj);
            if (errors.length > 0) {
                return;
            }
            loading.open();
            applyService.new_renewal_apply_obj({}, $scope.applyObj, function (res) {
                loading.close();
                if (res.result) {
                    msgModal.open("success", "新增成功");
                    $modalInstance.close();
                } else {
                    errorModal.open(res.data);
                }
            })
        };

        $scope.cancel = function () {
            $modalInstance.close();
        };

        $scope.rules = {}
        var validate = function (data) {
            var rules = {
                reason: '',
                ip: '',
                email: '',
                time: '',
                start_ip: '',
            };
            var errors = []
            if (!CWApp.isMail(data.email)) {
                errors.push("邮箱格式有误！");
                rules.email = "邮箱格式有误！"
            } else if (data.email === "") {
                rules.email = "邮箱不能为空！"
            }
            if (data.apply_reason == "") {
                errors.push("申请理由不能为空！")
                rules.reason = "申请理由不能为空！"
            } else if (data.apply_reason.length > 100) {
                errors.push("申请理由超过100个字！")
                rules.reason = "申请理由超过100个字！"
            }
            var oneError = CWApp.ValidateDate($filter, data.when_expired);
            if (oneError != "") {
                errors.push("所选时间比当前时间小");
                rules.time = "所选时间比当前时间小"
            }
            if (data.ip_type == "00") {
                if (data.ips == "") {
                    errors.push("IP不能为空！")
                    rules.ip = "IP不能为空！"
                } else {
                    var ipList = data.ips.split(",");
                    for (var i = 0; i < ipList.length; i++) {
                        if (!CWApp.isIP(ipList[i])) {
                            errors.push("IP格式不正确！");
                            rules.ip = "IP格式不正确！"
                            break;
                        }
                    }
                }
            } else {
                if (!CWApp.isIP(data.start_ip)) {
                    errors.push("起始IP格式不正确！");
                    rules.start_ip = "起始IP格式不正确！"
                }
                if (!CWApp.isIP(data.end_ip)) {
                    errors.push("结束IP格式不正确！");
                    rules.start_ip = "结束IP格式不正确！"
                }
                var start_ips = data.start_ip.split('.');
                var end_ips = data.end_ip.split('.');
                for (var i = 0; i < 4; i++) {
                    if (Number(start_ips[i]) > Number(end_ips[i])) {
                        errors.push("网段区域不正确！");
                        rules.start_ip = "网段区域不正确！"
                        break;
                    }
                }
            }
            $scope.rules = rules
            return errors;
        }
    }]);