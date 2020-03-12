controllers.controller("openRenewalCtrl", ["$scope", "$modalInstance", "itemObj",
    function ($scope, $modalInstance, itemObj) {
    $scope.title = "续约申请详情";
    $scope.flag = true;
    $scope.applyObj = itemObj;

    if(itemObj.status == "02"){
        $scope.isShow = true;
    }else{
        $scope.isShow = false;
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("cancel");
    };

}]);