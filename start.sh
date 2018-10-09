#!/bin/bash

mkdir -p /bitprim/logs
mkdir -p /bitprim/pids

# run_program (nodefile, pidfile, logfile)
run_program ()
{
  nodefile=$1
  pidfile=$2
  logfile=$3

  if [ -e "$pidfile" ]
  then
    echo "$nodefile is already running. Run 'npm stop' if you wish to restart."
    return 0
  fi

  nohup node $nodefile >> $logfile 2>&1 &
  PID=$!
  if [ $? -eq 0 ]
  then
    echo "Successfully started $nodefile. PID=$PID. Logs are at $logfile"
    echo $PID > $pidfile
    return 0
  else
    echo "Could not start $nodefile - check logs at $logfile"
    exit 1
  fi
}

run_program locker/locker.js /bitprim/pids/locker.pid /bitprim/logs/locker.log
run_program messagebroker/messagebroker.js /bitprim/pids/messagebroker.pid /bitprim/logs/messagebroker.log
run_program bcmonitor/bcmonitor.js /bitprim/pids/bcmonitor.pid /bitprim/logs/bcmonitor.log
run_program emailservice/emailservice.js /bitprim/pids/emailservice.pid /bitprim/logs/emailservice.log
run_program pushnotificationsservice/pushnotificationsservice.js /bitprim/pids/pushnotificationsservice.pid /bitprim/logs/pushnotificationsservice.log
run_program fiatrateservice/fiatrateservice.js /bitprim/pids/fiatrateservice.pid /bitprim/logs/fiatrateservice.log
run_program bws.js /bitprim/pids/bws.pid /bitprim/logs/bws.log

