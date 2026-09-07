Vagrant.configure("2") do |config|
	is_arm = RUBY_PLATFORM.include?("arm64") || RUBY_PLATFORM.include?("aarch64")

	config.vm.define "frontend" do |frontend|
		frontend.vm.box = "bento/ubuntu-22.04" if is_arm
		frontend.vm.box = "ubuntu/focal64" if !is_arm
		frontend.vm.box_architecture = "arm64" if is_arm
		frontend.vm.hostname = "frontend"
		#frontend.vm.network "forwarded_port", guest: 80, host: "8080"
		frontend.vm.network "private_network", ip: "10.20.30.1", netmask: "255.255.255.0", virtualbox__intnet: "encurtador_intnet"
		frontend.vm.provider "virtualbox" do |vb|
			vb.gui = !is_arm
			vb.memory = "1024"
			vb.cpus = 1
			vb.name = "frontend"
			end
		frontend.vm.provision "shell", inline: <<-SHELL
			sudo apt-get -y update
			sudo apt-get -y install net-tools
			sudo apt-get -y install nginx
		SHELL
	end

	config.vm.define "backend" do |backend|
		backend.vm.box = "bento/ubuntu-22.04" if is_arm
		backend.vm.box = "ubuntu/focal64" if !is_arm
		backend.vm.box_architecture = "arm64" if is_arm
		backend.vm.hostname = "backend"
		backend.vm.network "private_network", ip: "10.20.30.2", netmask: "255.255.255.0", virtualbox__intnet: "encurtador_intnet"
		backend.vm.provider "virtualbox" do |vb|
			vb.gui = !is_arm
			vb.memory = "1024"
			vb.cpus = 1
			vb.name = "backend"
			end
		backend.vm.provision "shell", inline: <<-SHELL
			sudo apt-get -y update
			sudo apt-get -y install net-tools
			sudo apt-get -y install curl
			curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
			sudo apt-get -y install nodejs
		SHELL
	end

	config.vm.define "db" do |db|
		db.vm.box = "bento/ubuntu-22.04" if is_arm
		db.vm.box = "ubuntu/focal64" if !is_arm
		db.vm.box_architecture = "arm64" if is_arm
		db.vm.hostname = "db"
		db.vm.network "private_network", ip: "10.20.30.3", netmask: "255.255.255.0", virtualbox__intnet: "encurtador_intnet"
		db.vm.provider "virtualbox" do |vb|
			vb.gui = !is_arm
			vb.memory = "1024"
			vb.cpus = 1
			vb.name = "db"
			end
		db.vm.provision "shell", inline: <<-SHELL
			sudo apt-get -y update
			sudo apt-get -y install net-tools
			sudo apt-get -y install mysql-server
		SHELL
	end
end
