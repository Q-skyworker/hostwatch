controllers.controller('syncLogDetailCtrl', ["$scope","moduleService", "itemObj", "loading", "errorModal", "$modalInstance",
    function ($scope, moduleService, itemObj, loading, errorModal, $modalInstance) {
    $scope.syncLogDetail = [];
    $scope.init = function () {
        loading.open();
        moduleService.search_sync_detail({}, itemObj, function (res) {
            loading.close();
            if(res.result) {
                $scope.syncLogDetail = res.data
            }else {
                errorModal.open(res.data)
            }
        });

    };
    $scope.init();
    $scope.close = function () {
        $modalInstance.close()
    }
}]);