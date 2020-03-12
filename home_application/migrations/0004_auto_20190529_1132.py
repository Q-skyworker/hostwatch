# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('home_application', '0003_logoimg'),
    ]

    operations = [
        migrations.CreateModel(
            name='AttrValueTemp',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('value', models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name='PoolAttrValue',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('value', models.CharField(max_length=100)),
            ],
        ),
        migrations.AddField(
            model_name='apply',
            name='dns',
            field=models.CharField(default=b'', max_length=50),
        ),
        migrations.AddField(
            model_name='apply',
            name='gate_way',
            field=models.CharField(default=b'', max_length=50),
        ),
        migrations.AddField(
            model_name='apply',
            name='net_mask',
            field=models.CharField(default=b'', max_length=50),
        ),
        migrations.AddField(
            model_name='ipattr',
            name='attr_type',
            field=models.CharField(default=b'ip', max_length=50),
        ),
        migrations.AddField(
            model_name='ipattr',
            name='is_required',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='ippools',
            name='dns',
            field=models.CharField(default=b'', max_length=50),
        ),
        migrations.AddField(
            model_name='ippools',
            name='gate_way',
            field=models.CharField(default=b'', max_length=50),
        ),
        migrations.AddField(
            model_name='ippools',
            name='net_mask',
            field=models.CharField(default=b'', max_length=50),
        ),
        migrations.AddField(
            model_name='ips',
            name='dns',
            field=models.CharField(default=b'', max_length=50),
        ),
        migrations.AddField(
            model_name='ips',
            name='gate_way',
            field=models.CharField(default=b'', max_length=50),
        ),
        migrations.AddField(
            model_name='ips',
            name='net_mask',
            field=models.CharField(default=b'', max_length=50),
        ),
        migrations.AddField(
            model_name='poolattrvalue',
            name='pool',
            field=models.ForeignKey(to='home_application.IPPools'),
        ),
        migrations.AddField(
            model_name='poolattrvalue',
            name='pool_attr',
            field=models.ForeignKey(to='home_application.IPAttr'),
        ),
        migrations.AddField(
            model_name='attrvaluetemp',
            name='apply',
            field=models.ForeignKey(to='home_application.Apply'),
        ),
        migrations.AddField(
            model_name='attrvaluetemp',
            name='ip_attr',
            field=models.ForeignKey(to='home_application.IPAttr'),
        ),
    ]
