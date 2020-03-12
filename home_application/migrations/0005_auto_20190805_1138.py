# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('home_application', '0004_auto_20190529_1132'),
    ]

    operations = [
        migrations.CreateModel(
            name='CmdbModel',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('model_id', models.CharField(max_length=100, verbose_name='\u6a21\u578b\u6807\u8bc6')),
                ('model_name', models.CharField(max_length=100, verbose_name='\u6a21\u578b\u540d\u79f0')),
                ('created_by', models.CharField(max_length=100)),
                ('when_created', models.DateTimeField(auto_now_add=True)),
                ('level', models.IntegerField(verbose_name='\u540c\u6b65\u4f18\u5148\u7ea7')),
            ],
            options={
                'verbose_name': 'CMDB\u6a21\u578b\u7ba1\u7406',
            },
        ),
        migrations.CreateModel(
            name='ModelMap',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('model_item', models.CharField(max_length=100, verbose_name='\u6a21\u578b\u5c5e\u6027')),
                ('ip_item', models.CharField(max_length=100, verbose_name='IP\u5c5e\u6027')),
                ('module', models.ForeignKey(to='home_application.CmdbModel')),
            ],
        ),
        migrations.CreateModel(
            name='SyncDetail',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('ip', models.CharField(max_length=100, verbose_name='IP')),
                ('type', models.CharField(max_length=100, verbose_name='\u7c7b\u578b')),
            ],
        ),
        migrations.CreateModel(
            name='SyncLog',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(default=b'', max_length=30)),
                ('model_name', models.CharField(max_length=100, verbose_name='\u6a21\u578b\u540d\u79f0')),
                ('created_by', models.CharField(max_length=100)),
                ('start_time', models.DateTimeField(auto_now_add=True)),
                ('end_time', models.CharField(max_length=100)),
                ('status', models.CharField(default=b'RUNNING', max_length=100, verbose_name='\u72b6\u6001')),
            ],
        ),
        migrations.AddField(
            model_name='ips',
            name='cloud_id',
            field=models.CharField(default=b'0', max_length=10),
        ),
        migrations.AddField(
            model_name='syncdetail',
            name='log',
            field=models.ForeignKey(to='home_application.SyncLog'),
        ),
    ]
