controllers.controller("checkApplyCtrl", ["$scope", "$modalInstance", "item", "loading", "applyService", function ($scope, $modalInstance, item, loading, applyService) {
    $scope.title = "查看申请";
    $scope.flag = true;
    $scope.isModify = true;
    $scope.applyObj = item;
    $scope.applyObj.ips = item.ip_list;
    $scope.applyObj.start_ip = "";
    $scope.applyObj.end_ip = "";
    if (item.ip_type == "01") {
        var net_ips = $scope.applyObj.ips.split("~");
        $scope.applyObj.start_ip = net_ips[0];
        $scope.applyObj.end_ip = net_ips[1]
    }
    $scope.isShow = item.refuse_reason != "";

    // IP自定义属性
    $scope.applyObj.attr_list = [];
    $scope.init = function () {
        loading.open();
        applyService.get_apply_attr({}, {id:$scope.applyObj.id}, function (res) {
            loading.close();
            if(res.result){
                $scope.applyObj.attr_list = res.data;
            }
        })
    };
    $scope.init();

    $scope.cancel = function () {
        $modalInstance.dismiss("cancel");
    };

}]);