controllers.controller("approveApplyCtrl", ["$scope", "confirmModal", "$filter", "loading", "errorModal", "$modalInstance", "applyService", "item", "msgModal", function ($scope, confirmModal, $filter, loading, errorModal, $modalInstance, applyService, item, msgModal) {
    $scope.title = "审核申请单";

    $scope.applyObj = item;
    $scope.applyObj.refuse_reason = "";


    $scope.refuse = function () {
        if ($scope.applyObj.refuse_reason == "") {
            errorModal.open(["拒绝理由不能为空！"]);
            return;
        }
        loading.open();
        applyService.refuse_apply({}, $scope.applyObj, function (res) {
            loading.close();
            if (res.result) {
                msgModal.open("success", "审批成功");
                $modalInstance.close();
            }
            else {
                errorModal.open(res.data);
            }
        })
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("cancel");
    };

}]);