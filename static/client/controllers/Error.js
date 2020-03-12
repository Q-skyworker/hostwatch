controllers.controller('error', ["$scope", "$modalInstance", "errorList", function ($scope, $modalInstance, errorList) {
    $scope.errors = [];
    if ((typeof errorList == 'object') && errorList.constructor == Array){
        $scope.errors = errorList;
    }
    else{
        $scope.errors = [errorList];
    }
    $scope.confirm = function () {
        $modalInstance.close();
    };
}]);