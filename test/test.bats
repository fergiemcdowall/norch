#!/usr/bin/env bats

@test "Show help?" {
  run ./bin/norch -h
  [ "${lines[0]}" = "  Usage: norch [options]" ]
  [ "${lines[1]}" = "  Options:" ]
  [ "${lines[2]}" = "    -h, --help                   output usage information" ]
  [ "${lines[3]}" = "    -V, --version                output the version number" ]
  [ "${lines[4]}" = "    -p, --port <port>            specify the port, defaults to PORT or 3030" ]
  [ "${lines[5]}" = "    -i, --indexPath <indexPath>  specify the name of the index directory, defaults to norch-index" ]
  [ "${lines[6]}" = "    -l, --logLevel <logLevel>    specify the loglevel- silly | debug | verbose | info | warn | error" ]
  [ "${lines[7]}" = "    -m, --machineReadable        machine readable, logo not printed, all stdout/stderr is JSON" ]
  [ $status = 0 ]
}

@test "Get homepage at /" {
  run curl http://localhost:9090
  echo "${output}"
  [[ $output =~ "doctype html" ]]
}

