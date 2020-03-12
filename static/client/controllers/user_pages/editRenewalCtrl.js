controllers.controller(
    "editRenewalCtrl", ["$scope", "ipPoolService", "$filter", "loading", "errorModal", "$modalInstance",
        "applyService", "msgModal", "itemObj", function ($scope, ipPoolService, $filter, loading, errorModal,
                                                         $modalInstance, applyService, msgModal, itemObj) {
    $scope.title = "编辑续约申请";
    $scope.flag = false;
    $scope.isShow = false;

    $scope.applyObj = angular.copy(itemObj);
    $scope.save = function () {
        $scope.applyObj.status = "03";
        loading.open();
        applyService.edit_renewal_apply_obj({}, $scope.applyObj, function (res) {
            loading.close();
            if (res.result) {
                msgModal.open("success", "保存成功");
                $modalInstance.close();
            }else {
                errorModal.open(res.data);
            }
        })
    };
    $scope.commit = function () {
        $scope.applyObj.status = "00";
        var errors = CWApp.validate_renewalApply($scope.applyObj, $filter);
        if (errors.length > 0) {
            errorModal.open(errors);
            return;
        }
        loading.open();
        applyService.edit_renewal_apply_obj({}, $scope.applyObj, function (res) {
            loading.close();
            if (res.result) {
                msgModal.open("success", "提交成功");
                $modalInstance.close();
            }else {
                errorModal.open(res.data);
            }
        })
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("cancel");
    };

}]);