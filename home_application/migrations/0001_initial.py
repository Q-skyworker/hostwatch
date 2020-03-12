# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Apply',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('apply_num', models.CharField(max_length=20)),
                ('email', models.CharField(default=b'', max_length=100)),
                ('when_created', models.CharField(max_length=20)),
                ('when_expired', models.CharField(max_length=20)),
                ('ip_list', models.TextField()),
                ('apply_type', models.CharField(default=b'00', max_length=10)),
                ('ip_type', models.CharField(max_length=10)),
                ('created_by', models.CharField(max_length=100)),
                ('business', models.CharField(max_length=200)),
                ('approved_by', models.CharField(default=b'', max_length=100, null=True)),
                ('when_approved', models.CharField(default=b'', max_length=20, null=True)),
                ('apply_reason', models.CharField(max_length=200)),
                ('refuse_reason', models.CharField(default=b'', max_length=200, null=True)),
                ('description', models.CharField(default=b'', max_length=200, null=True)),
                ('status', models.CharField(default=b'00', max_length=10)),
                ('is_deleted', models.BooleanField(default=False)),
            ],
            options={
                'verbose_name': 'IP\u7533\u8bf7\u7ba1\u7406',
            },
        ),
        migrations.CreateModel(
            name='ApplyIP',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('description', models.CharField(default=b'', max_length=200, null=True)),
                ('apply', models.ForeignKey(to='home_application.Apply')),
            ],
        ),
        migrations.CreateModel(
            name='AttrValue',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('value', models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name='IPAttr',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=50)),
                ('cn_name', models.CharField(max_length=50)),
                ('created_by', models.CharField(max_length=50)),
                ('when_created', models.CharField(max_length=30)),
                ('modify_by', models.CharField(max_length=50)),
                ('when_modify', models.CharField(max_length=30)),
                ('description', models.CharField(default=b'', max_length=200, null=True)),
            ],
            options={
                'verbose_name': 'IP\u81ea\u5b9a\u4e49\u5c5e\u6027\u7ba1\u7406',
            },
        ),
        migrations.CreateModel(
            name='IPPools',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('ip_start', models.CharField(max_length=50)),
                ('ip_end', models.CharField(max_length=50)),
                ('when_created', models.CharField(max_length=30)),
                ('when_modified', models.CharField(default=b'', max_length=30)),
                ('created_by', models.CharField(max_length=100)),
                ('modified_by', models.CharField(default=b'', max_length=100)),
                ('ip_net', models.CharField(max_length=100)),
                ('title', models.CharField(max_length=100)),
                ('all_count', models.IntegerField()),
                ('used_count', models.IntegerField()),
            ],
            options={
                'verbose_name': '\u8d44\u6e90\u6c60\u7ba1\u7406',
            },
        ),
        migrations.CreateModel(
            name='IPs',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('ip', models.CharField(max_length=20)),
                ('business', models.CharField(default=b'', max_length=100, null=True)),
                ('when_expired', models.CharField(max_length=20)),
                ('owner', models.CharField(max_length=100)),
                ('owner_mail', models.CharField(max_length=50)),
                ('is_expired', models.BooleanField(default=False)),
                ('is_deleted', models.BooleanField(default=False)),
                ('created_by', models.CharField(max_length=100)),
                ('modified_by', models.CharField(max_length=100)),
                ('when_modified', models.CharField(max_length=100)),
                ('when_created', models.CharField(max_length=100)),
                ('is_keep', models.BooleanField(default=False)),
                ('is_apply', models.BooleanField(default=True)),
                ('ip_status', models.CharField(default=b'00', max_length=10)),
                ('description', models.CharField(default=b'', max_length=200, null=True)),
                ('ip_pool', models.ForeignKey(to='home_application.IPPools')),
            ],
            options={
                'verbose_name': 'IP\u7ba1\u7406',
            },
        ),
        migrations.CreateModel(
            name='Mailboxes',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('username', models.CharField(max_length=50)),
                ('mailbox', models.CharField(max_length=100)),
                ('when_created', models.CharField(max_length=30)),
            ],
            options={
                'verbose_name': '\u90ae\u7bb1\u7ba1\u7406',
            },
        ),
        migrations.CreateModel(
            name='OperationLog',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('operator', models.CharField(max_length=100, null=True)),
                ('operate_type', models.TextField(max_length=100)),
                ('operate_detail', models.TextField(default=b'')),
                ('when_created', models.CharField(max_length=100, null=True)),
                ('operate_obj', models.CharField(default=b'', max_length=100)),
                ('operate_summary', models.TextField(default=b'')),
            ],
        ),
        migrations.CreateModel(
            name='Settings',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('key', models.CharField(max_length=50)),
                ('value', models.TextField()),
                ('description', models.CharField(max_length=100, null=True)),
            ],
            options={
                'verbose_name': '\u7cfb\u7edf\u8bbe\u7f6e',
            },
        ),
        migrations.AddField(
            model_name='attrvalue',
            name='ip',
            field=models.ForeignKey(to='home_application.IPs'),
        ),
        migrations.AddField(
            model_name='attrvalue',
            name='ip_attr',
            field=models.ForeignKey(to='home_application.IPAttr'),
        ),
        migrations.AddField(
            model_name='applyip',
            name='ip',
            field=models.ForeignKey(to='home_application.IPs'),
        ),
        migrations.AddField(
            model_name='apply',
            name='ip_pool',
            field=models.ForeignKey(to='home_application.IPPools', null=True),
        ),
    ]
