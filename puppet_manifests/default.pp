define append_if_no_such_line($file, $line, $refreshonly = 'false') {
   exec { "/bin/echo '$line' >> '$file'":
      unless      => "/bin/grep -Fxqe '$line' '$file'",
      path        => "/bin",
      refreshonly => $refreshonly,
   }
}

class norch {
  include apt

  apt::ppa { "ppa:chris-lea/node.js": }

  $packages = [ "curl", "git", "nodejs", "make", "g++" ]

  exec { 'apt-get update':
    command => '/usr/bin/apt-get update',
    before => Apt::Ppa["ppa:chris-lea/node.js"],
  }

  exec { 'apt-get update 2':
    command => '/usr/bin/apt-get update',
    require => Apt::Ppa["ppa:chris-lea/node.js"]
  }

  package { $packages:
    ensure => "installed",
    require => Exec['apt-get update 2']
  }
}

include norch
