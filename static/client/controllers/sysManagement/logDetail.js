controllers.controller("logDetail", function ($scope, $modalInstance, objectItem) {
    $scope.logDetail = objectItem.operate_detail;
    $scope.logType = objectItem.operate_type;

    $scope.cancel = function () {
        $modalInstance.dismiss("cancel");
    }
});