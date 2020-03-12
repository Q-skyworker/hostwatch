controllers.controller("renewalCtrl", ["$scope", "ipPoolService", "$filter", "loading", "errorModal", "$modalInstance",
    "applyService", "msgModal", "itemObj", function ($scope, ipPoolService, $filter, loading, errorModal,
                                                     $modalInstance, applyService, msgModal, itemObj) {
        $scope.title = "续约申请";
        $scope.flag = true;
        $scope.isShow = false;
        var date_now = new Date();
        $scope.DateStart = date_now.setDate(date_now.getDate() + 30);

        $scope.applyObj = {
            ip_type: "00",
            status: '00',
            ips: itemObj.ip,
            cloud_id: itemObj.cloud_id,
            start_ip: "",
            end_ip: "",
            when_expired: $filter('date')(itemObj.when_expired, 'yyyy-MM-dd'),
            apply_reason: "",
            email: itemObj.owner_mail
        };

        $scope.is_submit = false
        $scope.confirm = function () {
            var errors = validate();
            $scope.is_submit = true
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
            $modalInstance.dismiss("cancel");
        };

        $scope.rules = {}
        var validate = function () {
            var errors = [];
            var rules = {
                time: '',
                reason: ''
            }
            if (!CWApp.isMail($scope.applyObj.email)) {
                errors.push("邮箱格式有误！");
            }
            if ($scope.applyObj.apply_reason == "") {
                errors.push("申请理由不能为空！")
                rules.reason = "申请理由不能为空！"
            } else if ($scope.applyObj.apply_reason.length > 100) {
                errors.push("申请理由超过100个字！")
                rules.reason = "申请理由超过100个字！"
            }
            var oneError = CWApp.ValidateDate($filter, $scope.applyObj.when_expired);
            if (oneError != "") {
                errors.push(oneError);
                rules.time = "所选时间比当前时间小！"
            }
            if ($scope.applyObj.ip_type == "00") {
                var ipList = $scope.applyObj.ips.split(",");
                for (var i = 0; i < ipList.length; i++) {
                    if (!CWApp.isIP(ipList[i])) {
                        errors.push("IP格式不正确！");
                        break;
                    }
                }
            } else {
                if (!CWApp.isIP($scope.applyObj.start_ip)) {
                    errors.push("起始IP格式不正确！");
                }
                if (!CWApp.isIP($scope.applyObj.end_ip)) {
                    errors.push("结束IP格式不正确！");
                }
            }
            $scope.rules = rules
            return errors;
        };

    }]);