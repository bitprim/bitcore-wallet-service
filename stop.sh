#!/bin/bash

[ ! -n "PID_DIR" ] && LOGDIR=pids


stop_program ()
{
  pidfile=$1

  echo "Stopping Process - $pidfile. PID=$(cat $pidfile)"
  kill -9 $(cat $pidfile)
  rm $pidfile
  
}

stop_program ${PID_DIR}/bws.pid
stop_program ${PID_DIR}/fiatrateservice.pid
stop_program ${PID_DIR}/emailservice.pid
stop_program ${PID_DIR}/bcmonitor.pid
stop_program ${PID_DIR}/pushnotificationsservice.pid
stop_program ${PID_DIR}/messagebroker.pid
stop_program ${PID_DIR}/locker.pid

