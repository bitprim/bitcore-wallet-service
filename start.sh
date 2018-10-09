#!/bin/bash
[ ! -n ${PID_DIR} ] && PID_DIR=/bitprim/pids
[ ! -n ${LOG_DIR} ] && LOG_DIR=/bitprim/logs
mkdir -p ${PID_DIR}
mkdir -p ${LOG_DIR}

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

run_program locker/locker.js ${PID_DIR}/locker.pid ${LOG_DIR}/locker.log
run_program messagebroker/messagebroker.js ${PID_DIR}/messagebroker.pid ${LOG_DIR}/messagebroker.log
run_program bcmonitor/bcmonitor.js ${PID_DIR}/bcmonitor.pid ${LOG_DIR}/bcmonitor.log
run_program emailservice/emailservice.js ${PID_DIR}/emailservice.pid ${LOG_DIR}/emailservice.log
run_program pushnotificationsservice/pushnotificationsservice.js ${PID_DIR}/pushnotificationsservice.pid ${LOG_DIR}/pushnotificationsservice.log
run_program fiatrateservice/fiatrateservice.js ${PID_DIR}/fiatrateservice.pid ${LOG_DIR}/fiatrateservice.log
run_program bws.js ${PID_DIR}/bws.pid ${LOG_DIR}/bws.log

