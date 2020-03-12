controllers.controller("Message", ["$scope", "info", "$modalInstance", function ($scope, info, $modalInstance) {
    $scope.static_url = static_url;
    $scope.info = {
        text: info.msg,
        type: info.type,
    };
    $scope.cancel = function () {
        $modalInstance.close();
    }
}]);