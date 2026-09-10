Vagrant.configure("2") do |config|
	is_arm = RUBY_PLATFORM.include?("arm64") || RUBY_PLATFORM.include?("aarch64")

	# =========================================================
	# VM FRONTEND
	# =========================================================
	config.vm.define "client0" do |client|
		client.vm.box = "bento/ubuntu-26.04" if is_arm
		client.vm.box = "ubuntu/focal64" if !is_arm
		client.vm.box_architecture = "arm64" if is_arm
		client.vm.hostname = "frontend"

		config.vm.boot_timeout = 600

		# Rede interna
		client.vm.network "private_network",
			ip: "10.20.30.1",
			netmask: "255.255.255.0",
			virtualbox__intnet: "intnet"

		# Rede externa
		client.vm.network "public_network",
			bridge: "Intel(R) Ethernet Connection (17) I219-LM"

		client.vm.provider "virtualbox" do |vb|
			vb.gui = !is_arm
			vb.memory = "1024"
			vb.cpus = 1
			vb.name = "encurtador-frontend"
		end

		# Arquivos de configuração da frontend
		client.vm.provision "file",
			source: "Vagrant/frontend/99-installer-config.yaml",
			destination: "/tmp/99-installer-config.yaml"

		client.vm.provision "file",
			source: "Vagrant/frontend/encurtador.conf",
			destination: "/tmp/encurtador.conf"

		client.vm.provision "shell", inline: <<-SHELL
			set -e

			# Pacotes básicos
			sudo apt-get -y update
			sudo apt-get -y upgrade
			sudo apt-get -y install curl net-tools traceroute

			# =====================================================
			# NGINX
			# =====================================================
			sudo apt-get -y install nginx

			# =====================================================
			# Node.js 22 - usado para gerar o build do React
			# =====================================================
			curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
			sudo apt-get -y install nodejs

			node --version
			npm --version

			# =====================================================
			# Configuração de rede
			# =====================================================
			sudo mv /tmp/99-installer-config.yaml /etc/netplan/99-installer-config.yaml
			sudo chmod 600 /etc/netplan/99-installer-config.yaml
			sudo netplan apply

			# Habilita encaminhamento IPv4
			sudo sh -c 'echo "1" > /proc/sys/net/ipv4/ip_forward'

			sudo sed -i 's/#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/' /etc/sysctl.conf
			sudo sysctl -p

			# =====================================================
			# NAT / MASQUERADE
			# Permite backend e database acessarem a rede externa
			# através da VM frontend
			# =====================================================
			echo "iptables-persistent iptables-persistent/autosave_v4 boolean false" | debconf-set-selections
			echo "iptables-persistent iptables-persistent/autosave_v6 boolean false" | debconf-set-selections

			DEBIAN_FRONTEND=noninteractive sudo apt-get -y install iptables-persistent

			for EXT_IF in $(ip -o route show default | awk '{print $5}' | sort -u); do
				iptables -t nat -c POSTROUTING -s 10.20.30.0/24 -o "$EXT_IF" -j MASQUERADE 2>/dev/null \
				  || iptables -t nat -A POSTROUTING -s 10.20.30.0/24 -o "$EXT_IF" -j MASQUERADE
			done

			sudo netfilter-persistent save

			# =====================================================
			# BUILD DO FRONTEND REACT
			# =====================================================

			# Cria uma pasta própria dentro da VM para realizar o build.
			# Não rodamos npm ci diretamente dentro de /vagrant.
			sudo rm -rf /opt/encurtador-build
			sudo mkdir -p /opt/encurtador-build

			# Copia somente os arquivos necessários do frontend.
			# Assim evitamos copiar node_modules e dist do Windows.
			sudo cp /vagrant/package.json /opt/encurtador-build/
			sudo cp /vagrant/package-lock.json /opt/encurtador-build/
			sudo cp /vagrant/index.html /opt/encurtador-build/
			sudo cp /vagrant/vite.config.js /opt/encurtador-build/

			sudo cp -r /vagrant/src /opt/encurtador-build/

			cd /opt/encurtador-build

			# Instala as dependências e gera o dist/
			sudo npm ci
			sudo npm run build

			# =====================================================
			# DEPLOY DO REACT NO NGINX
			# =====================================================
			sudo rm -rf /var/www/encurtador
			sudo mkdir -p /var/www/encurtador

			sudo cp -r dist/* /var/www/encurtador/

			# =====================================================
			# CONFIGURAÇÃO DO NGINX
			# =====================================================

			# Instala nosso arquivo de configuração
			sudo install -m 644 /tmp/encurtador.conf /etc/nginx/sites-available/encurtador

			# Ativa o site
			sudo ln -sfn \
				/etc/nginx/sites-available/encurtador \
				/etc/nginx/sites-enabled/encurtador

			# Remove o site padrão do NGINX
			sudo rm -f /etc/nginx/sites-enabled/default

			# Testa a configuração antes de reiniciar
			sudo nginx -t

			# Faz o NGINX iniciar automaticamente
			sudo systemctl enable nginx
			sudo systemctl restart nginx
		SHELL
	end


	# =========================================================
	# VM BACKEND
	# =========================================================
	config.vm.define "client02" do |client02|
		client02.vm.box = "bento/ubuntu-26.04" if is_arm
		client02.vm.box = "ubuntu/focal64" if !is_arm
		client02.vm.box_architecture = "arm64" if is_arm
		client02.vm.hostname = "backend"

		config.vm.boot_timeout = 600

		client02.vm.network "private_network",
			ip: "10.20.30.2",
			netmask: "255.255.255.0",
			virtualbox__intnet: "intnet"

		client02.vm.provider "virtualbox" do |vb|
			vb.gui = !is_arm
			vb.memory = "1024"
			vb.cpus = 1
			vb.name = "encurtador-backend"
		end

		client02.vm.provision "file",
			source: "Vagrant/backend/99-installer-config.yaml",
			destination: "/tmp/99-installer-config.yaml"

		client02.vm.provision "shell", inline: <<-SHELL
			sudo apt-get -y update
			sudo apt-get -y upgrade
			sudo apt-get -y install curl net-tools traceroute

			sudo mv /tmp/99-installer-config.yaml /etc/netplan/99-installer-config.yaml
			sudo chmod 600 /etc/netplan/99-installer-config.yaml

			sudo netplan apply
		SHELL
	end


	# =========================================================
	# VM DATABASE
	# =========================================================
	config.vm.define "client03" do |client03|
		client03.vm.box = "bento/ubuntu-26.04" if is_arm
		client03.vm.box = "ubuntu/focal64" if !is_arm
		client03.vm.box_architecture = "arm64" if is_arm
		client03.vm.hostname = "database"

		config.vm.boot_timeout = 600

		client03.vm.network "private_network",
			ip: "10.20.30.3",
			netmask: "255.255.255.0",
			virtualbox__intnet: "intnet"

		client03.vm.provider "virtualbox" do |vb|
			vb.gui = !is_arm
			vb.memory = "1024"
			vb.cpus = 1
			vb.name = "encurtador-database"
		end

		client03.vm.provision "file",
			source: "Vagrant/database/99-installer-config.yaml",
			destination: "/tmp/99-installer-config.yaml"

		client03.vm.provision "shell", inline: <<-SHELL
			sudo apt-get -y update
			sudo apt-get -y upgrade
			sudo apt-get -y install curl net-tools traceroute

			sudo mv /tmp/99-installer-config.yaml /etc/netplan/99-installer-config.yaml
			sudo chmod 600 /etc/netplan/99-installer-config.yaml

			sudo netplan apply
		SHELL
	end
end