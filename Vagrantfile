Vagrant.configure("2") do |config|
	is_arm = RUBY_PLATFORM.include?("arm64") || RUBY_PLATFORM.include?("aarch64")

	config.vm.boot_timeout = 600

	# =========================================================
	# VM FRONTEND
	# =========================================================
	config.vm.define "client0" do |client|
		client.vm.box = "bento/ubuntu-26.04" if is_arm
		client.vm.box = "ubuntu/focal64" if !is_arm
		client.vm.box_architecture = "arm64" if is_arm
		client.vm.hostname = "frontend"

		# Rede interna
		client.vm.network "private_network",
			ip: "10.20.30.1",
			netmask: "255.255.255.0",
			virtualbox__intnet: "intnet"

		# Rede externa
		client.vm.network "public_network"

		client.vm.provider "virtualbox" do |vb|
			vb.gui = false
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
			export DEBIAN_FRONTEND=noninteractive

			# Pacotes básicos
			apt-get -y update
			apt-get -y upgrade
			apt-get -y install curl net-tools traceroute

			# =====================================================
			# NGINX
			# =====================================================
			apt-get -y install nginx

			# =====================================================
			# Node.js 22 - usado para gerar o build do React
			# =====================================================
			curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
			apt-get -y install nodejs

			node --version
			npm --version

			# =====================================================
			# Configuração de rede
			# =====================================================
			mv /tmp/99-installer-config.yaml /etc/netplan/99-installer-config.yaml
			chmod 600 /etc/netplan/99-installer-config.yaml
			netplan apply

			# Habilita encaminhamento IPv4
			sh -c 'echo "1" > /proc/sys/net/ipv4/ip_forward'

			sed -i 's/#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/' /etc/sysctl.conf
			sysctl -p

			# =====================================================
			# NAT / MASQUERADE
			# Permite backend e database acessarem a rede externa
			# através da VM frontend
			# =====================================================
			echo "iptables-persistent iptables-persistent/autosave_v4 boolean false" | debconf-set-selections
			echo "iptables-persistent iptables-persistent/autosave_v6 boolean false" | debconf-set-selections

			apt-get -y install iptables-persistent

			for EXT_IF in $(ip -o route show default | awk '{print $5}' | sort -u); do
				iptables -t nat -C POSTROUTING -s 10.20.30.0/24 -o "$EXT_IF" -j MASQUERADE 2>/dev/null \
				  || iptables -t nat -A POSTROUTING -s 10.20.30.0/24 -o "$EXT_IF" -j MASQUERADE
			done

			netfilter-persistent save

			# =====================================================
			# BUILD DO FRONTEND REACT
			# =====================================================

			# Cria uma pasta própria dentro da VM para realizar o build.
			# Não rodamos npm ci diretamente dentro de /vagrant.
			rm -rf /opt/encurtador-build
			mkdir -p /opt/encurtador-build

			# Copia somente os arquivos necessários do frontend.
			# Assim evitamos copiar node_modules e dist do Windows.
			cp /vagrant/package.json /opt/encurtador-build/
			cp /vagrant/package-lock.json /opt/encurtador-build/
			cp /vagrant/index.html /opt/encurtador-build/
			cp /vagrant/vite.config.js /opt/encurtador-build/

			cp -r /vagrant/src /opt/encurtador-build/

			cd /opt/encurtador-build

			# Instala as dependências e gera o dist/
			npm ci
			npm run build

			# =====================================================
			# DEPLOY DO REACT NO NGINX
			# =====================================================
			rm -rf /var/www/encurtador
			mkdir -p /var/www/encurtador

			cp -r dist/* /var/www/encurtador/

			# =====================================================
			# CONFIGURAÇÃO DO NGINX
			# =====================================================

			# Instala nosso arquivo de configuração
			install -m 644 /tmp/encurtador.conf /etc/nginx/sites-available/encurtador

			# Ativa o site
			ln -sfn \
				/etc/nginx/sites-available/encurtador \
				/etc/nginx/sites-enabled/encurtador

			# Remove o site padrão do NGINX
			rm -f /etc/nginx/sites-enabled/default

			# Testa a configuração antes de reiniciar
			nginx -t

			# Faz o NGINX iniciar automaticamente
			systemctl enable nginx
			systemctl restart nginx
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

		client03.vm.network "private_network",
			ip: "10.20.30.3",
			netmask: "255.255.255.0",
			virtualbox__intnet: "intnet"

		client03.vm.provider "virtualbox" do |vb|
			vb.gui = false
			vb.memory = "1024"
			vb.cpus = 1
			vb.name = "encurtador-database"
		end

		client03.vm.provision "file",
			source: "Vagrant/database/99-installer-config.yaml",
			destination: "/tmp/99-installer-config.yaml"

		client03.vm.provision "file",
			source: "Vagrant/database/99-lab.cnf",
			destination: "/tmp/99-lab.cnf"

		client03.vm.provision "file",
			source: "Vagrant/database/init.sql",
			destination: "/tmp/init.sql"

		client03.vm.provision "shell", inline: <<-SHELL
			set -e
			export DEBIAN_FRONTEND=noninteractive

			apt-get -y update
			apt-get -y upgrade
			apt-get -y install curl net-tools traceroute

			mv /tmp/99-installer-config.yaml /etc/netplan/99-installer-config.yaml
			chmod 600 /etc/netplan/99-installer-config.yaml

			netplan apply

			# =====================================================
			# MYSQL
			# =====================================================
			apt-get -y install mysql-server

			# Faz o MySQL escutar no IP da rede interna (10.20.30.3)
			# ao invés de apenas 127.0.0.1
			install -m 644 /tmp/99-lab.cnf /etc/mysql/mysql.conf.d/99-lab.cnf

			# Aplica o novo bind-address antes de rodar os scripts SQL
			systemctl restart mysql

			# =====================================================
			# CARGA DO BANCO
			# Como root do sistema, o plugin auth_socket autentica
			# sem senha. Os dois scripts são idempotentes.
			# =====================================================
			mysql < /vagrant/server/schema.sql
			mysql < /tmp/init.sql

			# Faz o MySQL iniciar automaticamente
			systemctl enable mysql
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

		client02.vm.network "private_network",
			ip: "10.20.30.2",
			netmask: "255.255.255.0",
			virtualbox__intnet: "intnet"

		client02.vm.provider "virtualbox" do |vb|
			vb.gui = false
			vb.memory = "1024"
			vb.cpus = 1
			vb.name = "encurtador-backend"
		end

		client02.vm.provision "file",
			source: "Vagrant/backend/99-installer-config.yaml",
			destination: "/tmp/99-installer-config.yaml"

		client02.vm.provision "file",
			source: "Vagrant/backend/env.backend",
			destination: "/tmp/env.backend"

		client02.vm.provision "file",
			source: "Vagrant/backend/encurtador-api.service",
			destination: "/tmp/encurtador-api.service"

		client02.vm.provision "shell", inline: <<-SHELL
			set -e
			export DEBIAN_FRONTEND=noninteractive

			apt-get -y update
			apt-get -y upgrade
			apt-get -y install curl net-tools traceroute

			mv /tmp/99-installer-config.yaml /etc/netplan/99-installer-config.yaml
			chmod 600 /etc/netplan/99-installer-config.yaml

			netplan apply

			# =====================================================
			# Node.js 22 - runtime da API
			# =====================================================
			curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
			apt-get -y install nodejs

			node --version
			npm --version

			# Confirma o caminho do binário usado no ExecStart da unit
			echo "Binário do node: $(command -v node) (a unit usa /usr/bin/node)"

			# =====================================================
			# DEPLOY DA API
			# =====================================================

			# Para o serviço antes de mexer nos arquivos, para o
			# Restart=always não entrar em laço durante o npm ci.
			# O || true cobre a primeira execução, quando a unit
			# ainda não existe.
			systemctl stop encurtador-api || true

			# Copia o código para dentro da VM. Nunca rodamos npm ci
			# dentro de /vagrant: a pasta compartilhada é lenta e
			# quebra com os symlinks criados pelo npm no Windows.
			rm -rf /opt/encurtador-api
			mkdir -p /opt/encurtador-api

			cp /vagrant/server/package.json /opt/encurtador-api/
			cp /vagrant/server/package-lock.json /opt/encurtador-api/
			cp /vagrant/server/index.js /opt/encurtador-api/
			cp /vagrant/server/db.js /opt/encurtador-api/

			cd /opt/encurtador-api

			# Instala apenas as dependências de produção
			npm ci --omit=dev

			# =====================================================
			# CONFIGURAÇÃO E SERVIÇO
			# =====================================================

			# Aponta a API para o MySQL da VM database (10.20.30.3)
			install -m 640 /tmp/env.backend /opt/encurtador-api/.env

			# Instala a unit do systemd
			install -m 644 /tmp/encurtador-api.service /etc/systemd/system/encurtador-api.service

			systemctl daemon-reload
			systemctl enable --now encurtador-api

			# Garante que um novo provision suba o código atualizado
			systemctl restart encurtador-api

			# =====================================================
			# VALIDAÇÃO
			# =====================================================

			# Dá tempo do Express subir antes de consultar
			sleep 5

			systemctl status encurtador-api --no-pager || true
			curl -s http://localhost:3000/api/urls || true
			echo
		SHELL
	end
end
