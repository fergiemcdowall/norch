#!/usr/bin/env bats

@test "Show help?" {
  run ./bin/norch -h
  [ "${lines[0]}" = "  Usage: norch [options]" ]
  [ "${lines[1]}" = "  Options:" ]
  [ "${lines[2]}" = "    -h, --help                   output usage information" ]
  [ "${lines[3]}" = "    -V, --version                output the version number" ]
  [ "${lines[4]}" = "    -o, --siOptions <siOptions>  specify search-index options" ]
  [ "${lines[5]}" = "    -p, --port <port>            specify the port, defaults to PORT or 3030" ]
  [ "${lines[6]}" = "    -i, --norchHome <norchHome>  specify the name of the directory that stores the data and the logs, defaults to norch-index" ]
  [ "${lines[7]}" = "    -l, --logLevel <logLevel>    specify the loglevel- silly | debug | verbose | info | warn | error" ]
  [ "${lines[8]}" = "    -m, --machineReadable        machine readable, logo not printed, all stdout/stderr is JSON" ]
  [ $status = 0 ]
}

@test "Show help with runNorch.js?" {
  run node ./lib/runNorch.js -h
  [ "${lines[0]}" = "  Usage: runNorch [options]" ]
  [ "${lines[1]}" = "  Options:" ]
  [ "${lines[2]}" = "    -h, --help                   output usage information" ]
  [ "${lines[3]}" = "    -V, --version                output the version number" ]
  [ "${lines[4]}" = "    -o, --siOptions <siOptions>  specify search-index options" ]
  [ "${lines[5]}" = "    -p, --port <port>            specify the port, defaults to PORT or 3030" ]
  [ "${lines[6]}" = "    -i, --norchHome <norchHome>  specify the name of the directory that stores the data and the logs, defaults to norch-index" ]
  [ "${lines[7]}" = "    -l, --logLevel <logLevel>    specify the loglevel- silly | debug | verbose | info | warn | error" ]
  [ "${lines[8]}" = "    -m, --machineReadable        machine readable, logo not printed, all stdout/stderr is JSON" ]
  [ $status = 0 ]
}

@test "Get homepage at /" {
  run curl http://localhost:9090
  echo "${output}"
  [[ $output =~ "doctype html" ]]
}
