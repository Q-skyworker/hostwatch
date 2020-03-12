controllers.controller("openNewCtrl", ["$scope", "$filter", "loading", "$modalInstance",
        "applyService", "itemObj", "msgModal", function ($scope, $filter, loading,
                                                         $modalInstance, applyService, itemObj, msgModal) {
    $scope.title = "详情";
    $scope.flag = true;
    $scope.isModify = true;
    $scope.applyObj = itemObj;

    if(itemObj.status == "02"){
        $scope.isShow = true;
    }else{
        $scope.isShow = false;
    }

    // IP自定义属性
    $scope.applyObj.attr_list = [];
    $scope.init = function () {
        loading.open();
        applyService.get_apply_attr({}, {id: $scope.applyObj.id}, function (res) {
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