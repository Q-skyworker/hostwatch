controllers.controller("home", ["$scope", "siteService", function ($scope, siteService) {
    $scope.countObj = {};
    $scope.userIpList = [];
    $scope.applyList = [];
    $scope.ipUsedReports = {
        data: "userIpList",
        title: {text: '已使用IP统计', enabled: true},
        unit: "个",
        size: "250px"
    };

    $scope.applyReports = {
        data: "applyList",
        chart: {type: 'line'},
        title: {text: '近期的申请单（10天）', enabled: true},
        yAxis: {
            allowDecimals: true,
            title: {
                text: '申请单数'
            }
        },
        xAxis: {
            categories: []
        },
        //提示框位置和显示内容
        tooltip: {
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
            '<td style="padding:0"><b>{point.y:f}</b></td></tr>',
            headerFormat: ""
        }
    };

    siteService.get_count_obj({}, {}, function (res) {
        if (res.result) {
            $scope.countObj = res.data;
            $scope.userIpList = res.userIpList;
            $scope.applyReports.xAxis.categories = res.categories;
            $scope.applyList = res.applyList;
        }
    })

}]);
