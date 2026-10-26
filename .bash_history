#1770352503
unset PROMPT_COMMAND
#1770352503
PS1='[PEXPECT]\$ '
#1770352503
tar zxf /opt/APM_v002.tar.gz -C /opt --strip 1 APM_v002/*;find /opt -maxdepth 1 -name '*.tar.gz' -exec unlink {} \;
#1770352564
mv -f /opt/my.cnf /etc/; mv -f /opt/src/* /root/src/; rm -rf /opt/src; sh /root/tmp/clear_log.sh
#1770352570
exit
#1770539992
ls
#1770540015
w
#1770540020
ls
#1770540268
mysql
#1770540275
ps -ef | grep mysql;
#1770540280
service mysql start
#1770540283
service mysqld start
#1770540288
service mariadb start
#1770540297
ps -ef | grep apache
#1770540302
service apache start
#1770540307
service httpd start
#1770540308
ls
#1770540339
which mysql;
#1770540345
cd /opt/mysql/bin/
#1770540345
ls
#1770540397
which mysql;
#1770540400
which httpd
#1770540406
service httpd start
#1770540486
systemctl start httpd
#1770540495
systemctl start mariadb
#1770540518
.
#1770540533
/opt/apache/bin/apachectl start
#1770540542
/opt/mysql/bin/mysqld_safe --user=mysql &
#1770540561
vi /etc/rc.d/rc.local
#1770540581
chmod +x /etc/rc.d/rc.local
#1770540600
ls
#1770540601
mysql
#1770540604
mysql -u root
#1770540632
find /opt/mysql -name "*.sock"
#1770540646
ls
#1770540647
cd ..
#1770540647
ls
#1770540660
cd ..
#1770540660
ls
#1770540663
cd mysql/
#1770540663
ls
#1770540675
cat /opt/mysql/my.cnf | grep socket
#1770540693
ls
#1770540697
cd ..
#1770540697
ls
#1770540698
cd ..
#1770540698
ls
#1770540700
cd /tmp/
#1770540700
ls
#1770540712
cd /opt/mysql/
#1770540712
ls
#1770540715
cd bin/
#1770540715
ls
#1770540719
./mysql -u root
#1770540727
ps -ef | grep mysql
#1770540732
/opt/mysql/bin/mysqld_safe --user=mysql &
#1770540756
tail -50 /opt/mysql/data/qm391-0679.cafe24.com.err
#1770540779
ldd /opt/mysql/bin/mysqld | grep libaio
#1770540809
dnf install -y libaio libaio-devel
#1770540817
/opt/mysql/bin/mysqld_safe --user=mysql &
#1770540840
ldd /opt/mysql/bin/mysqld
#1770540851
/opt/mysql/bin/mysqld --user=mysql
#1770540861
cd ..
#1770540861
ls
#1770540863
mkdir data
#1770540864
ls -al
#1770540871
chown mysql:mysql data
#1770540876
/opt/mysql/bin/mysqld_safe --user=mysql &
#1770540885
ps -ef } grep mysql
#1770540891
ps -ef | grep mysql
#1770540903
/opt/mysql/bin/mysqld_safe --user=mysql &
#1770540916
/opt/mysql/bin/mysqld --user=mysql
#1770540949
/opt/mysql/bin/mysqld --initialize-insecure   --user=mysql   --basedir=/opt/mysql   --datadir=/opt/mysql/data
#1770540977
rm -rf data
#1770540978
[root@qm391-0679 /opt/mysql]# /opt/mysql/bin/mysqld --initialize-insecure >   --user=mysql >   --basedir=/opt/mysql >   --datadir=/opt/mysql/data
#1770540978
2026-02-08T17:55:49.828848+09:00 0 [Warning] TIMESTAMP with implicit DEFAULT value is deprecated. Please use --explicit_defaults_for_timestamp server option (see documentation for more details).
#1770540978
2026-02-08T17:55:49.829790+09:00 0 [ERROR] --initialize specified but the data directory has files in it. Aborting.
#1770540978
2026-02-08T17:55:49.829807+09:00 0 [ERROR] Aborting
#1770540981
ls -al
#1770541005
/opt/mysql/bin/mysqld --initialize-insecure   --user=mysql   --basedir=/opt/mysql   --datadir=/opt/mysql/data
#1770541015
/opt/mysql/bin/mysqld_safe --user=mysql &
#1770541022
/opt/mysql/bin/mysql -u root
#1770541034
mysql
#1770541267
cd /home/
#1770541267
ls
#1770541269
cd /r
#1770541269
ls
#1770541271
cd
#1770541271
ls
#1770541272
ls -al
#1770541794
s
#1770541804
cd /opt/apache/
#1770541805
ls
#1770541806
cd conf/
#1770541807
ls
#1770541809
vi httpd.conf
#1770541831
ls
#1770541833
cd extra/
#1770541833
ls
#1770541836
vi httpd-vhosts.conf 
#1770541930
cd ..
#1770541930
ls
#1770541934
vi httpd.conf
#1770541954
cd /opt/apache/htdocs/
#1770541954
ls
#1770541957
cd ..
#1770541957
ls
#1770541964
mv /root/public_html.tgz ./
#1770541968
tar -xzvf public_html.tgz 
#1770542052
ls
#1770542065
mv htdocs/ mm
#1770542070
mv public_html htdocs
#1770542084
ls
#1770542087
cd htdocs/
#1770542088
ls
#1770542108
cd ..
#1770542109
ls
#1770542111
cd htdocs/
#1770542111
ls
#1770542120
cd ..
#1770542120
ls
#1770542122
cd logs/
#1770542122
ls
#1770542124
tail -f access_log 
#1770542128
tail -f error_log 
#1770542137
ps -ef | grep apache
#1770542144
cd ..
#1770542144
ls
#1770542146
cd bin/
#1770542146
ls
#1770542150
apachectl stop
#1770542155
ps -ef
#1770542158
ps -ef | grep httpd
#1770542161
apachectl start
#1770542169
cd /home/
#1770542169
ls
#1770542174
cd /opt/apache/
#1770542174
ls
#1770542175
sl -al
#1770542176
ls -al
#1770542191
cd htdocs/
#1770542191
lsd
#1770542192
ls -al
#1770542209
cd ..
#1770542209
ls
#1770542219
chown root:root -R htdocs/
#1770542221
ls -al
#1770542230
cd htdocs/
#1770542230
ls
#1770542238
ls -al
#1770542241
cd ..
#1770542241
ls
#1770542247
cd logs/
#1770542247
ls
#1770542249
tail -f error_log 
#1770542346
cd ..
#1770542346
ls
#1770542351
cd logs/
#1770542352
ls
#1770542356
tail -f access_log 
#1770542381
ls
#1770542385
ps -ef | grep httpd
#1770542396
cd ..
#1770542396
ls
#1770542397
ls -al
#1770542399
cd mm/
#1770542399
ls
#1770542400
ls -al
#1770542404
cd ..
#1770542404
ls
#1770542406
cd htdocs/
#1770542406
ls
#1770542407
ls -al
#1770542414
cd ..
#1770542414
ls
#1770542421
cd /var/log/
#1770542421
ls
#1770542432
telnet 1.234.63.199 80
#1770542477
cd /opt/apache/
#1770542477
ls
#1770542478
cd logs/
#1770542479
ls
#1770542481
tail -f error_log 
#1770542547
/opt/apache/bin/httpd -M | grep rewrite
#1770542739
cd..
#1770542740
cd ..
#1770542740
ls
#1770542742
cd htdocs/
#1770542742
ls
#1770542746
vi .htaccess 
#1770542792
cd ..
#1770542793
ls
#1770542794
cd conf/
#1770542794
ls
#1770542796
vi httpd.conf
#1770542823
cd ..
#1770542824
sl
#1770542825
cd bin/
#1770542828
apachectl stop
#1770542830
apachectl start
#1770544898
cd ..
#1770544898
ls
#1770544899
cd ..
#1770544899
ls
#1770544900
cd mysql/
#1770544901
ls
#1770544909
cd data
#1770544910
ls
#1770544916
cd ..
#1770544916
ls
#1770544924
cd bin/
#1770544924
ls
#1770544926
cd ..
#1770544926
ls
#1770544928
cd data/
#1770544928
ls
#1770544934
vi my.cnf
#1770544935
ls
#1770544941
pwd
#1770544943
cd ..
#1770544944
ls
#1770544944
pwd
#1770544963
find / -name "my.cnf"
#1770545010
pwd
#1770545036
vi /etc/my.cnf 
#1770545052
:q
#1770545053
 systemctl restart mysql
#1770545059
service mysql restart
#1770545080
cd bin/
#1770545080
ls
#1770545111
pwd
#1770545258
ps -ef | grep mysqld
#1770545286
/opt/mysql/bin/mysqladmin -u root -p shutdown
#1770545302
/opt/mysql/bin/mysqld --defaults-file=/opt/mysql/my.cnf &
#1770545309
/opt/mysql/bin/mysqld --defaults-file=/etc/my.cnf &
#1770545373
mysql
#1770545377
/opt/mysql/bin/mysqld --defaults-file=/etc/my.cnf &
#1770545393
sudo useradd -r -s /bin/false mysql
#1770545393
sudo chown -R mysql:mysql /opt/mysql
#1770545406
sudo -u mysql /opt/mysql/bin/mysqld --defaults-file=/etc/my.cnf &
#1770545413
myqsl
#1770545415
mysql
#1770889672
w
#1774333428
ls
#1774333439
cd /home/
#1774333439
ls
#1774333442
cd /var/www
#1774333443
ls
#1774333448
cd /opt/apache/htdocs/
#1774333448
ls
#1774333451
pwd
#1774333466
ls
#1774333467
cd upload/
#1774333467
ls
#1774333820
pwd
#1774333924
ls
#1773827551
ls
#1773827555
passwd 
#1773827568
w
#1773827570
ls
#1773827572
cd /home/
#1773827573
ls
#1773827575
cd /usr/local/
#1773827575
ls
#1773827579
cd /opt/
#1773827579
ls
#1773827581
cd apache/
#1773827581
ls
#1773827587
cd htdocs/
#1773827587
ls
#1774152346
su noti
#1774152346
ls
#1774152350
su noti
#1774152352
ls
#1774164032
w
#1791333491
mysql -e "SHOW DATABASES;"
#1791333529
mysqldump nanobook > /root/nanobook_backup.sql
#1791333549
ls -lh /root/nanobook_backup.sql
#1791333576
gzip -k /root/nanobook_backup.sql
