# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "precise64"
  config.vm.box_url = "http://files.vagrantup.com/precise64.box"
  config.vm.network :forwarded_port, guest: 3000, host: 3000
  config.vm.provision :puppet, :module_path => "puppet_modules" do |puppet|
    puppet.manifests_path = "puppet_manifests"
    puppet.manifest_file  = "default.pp"
  end
end
