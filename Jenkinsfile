pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "monapp-${BUILD_NUMBER}"
        CONTAINER_NAME = "monapp-${BUILD_NUMBER}"
        HOST_PORT = "3002"
        CONTAINER_PORT = "3000"
    }

    stages {
        stage('0. Pré-requis') {
            steps {
                script {
                    bat """
                    echo "=== VÉRIFICATION SYSTÈME ==="
                    echo "Jenkins Workspace: %WORKSPACE%"
                    
                    echo "1. Docker version:"
                    docker --version
                    
                    echo "2. Node version:"
                    node --version || echo "Node non installé sur l'agent"
                    
                    echo "3. NPM version:"
                    npm --version || echo "NPM non installé"
                    
                    echo "4. Conteneurs existants:"
                    docker ps -a
                    
                    echo "5. Ports utilisés:"
                    netstat -ano | findstr :3000 :3001 :3002
                    
                    echo "6. Fichiers présents:"
                    dir
                    """
                }
            }
        }
        
        stage('1. Checkout') {
            steps {
                checkout scm
                bat 'echo "✅ Checkout terminé"'
                
                // Afficher les fichiers
                bat """
                echo "=== STRUCTURE DU PROJET ==="
                dir /s /b
                echo ""
                echo "=== DOCKERFILE ==="
                type Dockerfile
                echo ""
                echo "=== PACKAGE.JSON ==="
                type package.json
                echo ""
                echo "=== SERVER.JS ==="
                type server.js
                """
            }
        }

        stage('2. Test Local First') {
            steps {
                script {
                    bat """
                    echo "=== TEST LOCAL SANS DOCKER ==="
                    
                    echo "1. Installation dépendances:"
                    npm install
                    
                    echo "2. Vérification server.js:"
                    node -e "const app = require('./server.js'); console.log('Server.js OK');" 2>&1 || node -e "import('./server.js').then(() => console.log('ESM OK')).catch(e => console.error(e))" 2>&1
                    
                    echo "3. Test démarrage manuel (10 secondes):"
                    start "Test Server" cmd /c "node server.js && pause"
                    timeout /t 5 /nobreak
                    
                    echo "4. Test connexion:"
                    curl http://localhost:3000 2>&1 || powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 5 } catch { Write-Host 'Échec local: ' + \$_.Exception.Message }"
                    
                    timeout /t 2 /nobreak
                    taskkill /f /im node.exe 2>nul || echo "Pas de processus node"
                    """
                }
            }
        }

        stage('3. Docker Build DEBUG') {
            steps {
                script {
                    bat """
                    echo "=== DOCKER BUILD DÉTAILLÉ ==="
                    echo "Nettoyage préalable..."
                    docker stop ${env.CONTAINER_NAME} 2>nul || echo OK
                    docker rm ${env.CONTAINER_NAME} 2>nul || echo OK
                    docker rmi ${env.DOCKER_IMAGE} 2>nul || echo OK
                    """
                    
                    // Build avec output complet
                    bat """
                    echo "Construction avec logs détaillés..."
                    docker build --no-cache --progress=plain -t ${env.DOCKER_IMAGE} . 2>&1 | tee docker_build.log
                    
                    echo "=== VÉRIFICATION IMAGE ==="
                    docker images ${env.DOCKER_IMAGE}
                    
                    echo "=== INSPECTION IMAGE ==="
                    docker inspect ${env.DOCKER_IMAGE} --format="
                    Image ID: {{.Id}}
                    Created: {{.Created}}
                    Size: {{.Size}}
                    Cmd: {{.Config.Cmd}}
                    Entrypoint: {{.Config.Entrypoint}}
                    WorkingDir: {{.Config.WorkingDir}}
                    "
                    """
                }
            }
        }

        stage('4. Docker Run DEBUG') {
            steps {
                script {
                    bat """
                    echo "=== DOCKER RUN DÉTAILLÉ ==="
                    
                    echo "1. Lancement conteneur en mode détaché:"
                    docker run -d \\
                        -p ${env.HOST_PORT}:${env.CONTAINER_PORT} \\
                        --name ${env.CONTAINER_NAME} \\
                        ${env.DOCKER_IMAGE}
                    
                    echo "2. Attente démarrage..."
                    timeout /t 30 /nobreak
                    
                    echo "3. État conteneur:"
                    docker ps -a --filter "name=${env.CONTAINER_NAME}" --format="table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"
                    
                    echo "4. Logs conteneur (dernières 50 lignes):"
                    docker logs ${env.CONTAINER_NAME} --tail 50 2>&1 || echo "Aucun log disponible"
                    
                    echo "5. Inspection conteneur:"
                    docker inspect ${env.CONTAINER_NAME} --format="
                    État: {{.State.Status}}
                    Running: {{.State.Running}}
                    StartedAt: {{.State.StartedAt}}
                    FinishedAt: {{.State.FinishedAt}}
                    ExitCode: {{.State.ExitCode}}
                    Error: {{.State.Error}}
                    "
                    
                    echo "6. Vérification processus dans conteneur:"
                    docker exec ${env.CONTAINER_NAME} ps aux 2>&1 || echo "Impossible d'exécuter dans conteneur (probablement arrêté)"
                    
                    echo "7. Vérification fichiers dans conteneur:"
                    docker exec ${env.CONTAINER_NAME} ls -la /app 2>&1 || echo "Impossible de lister fichiers"
                    
                    echo "8. Vérification node_modules:"
                    docker exec ${env.CONTAINER_NAME} ls -la /app/node_modules 2>&1 || echo "node_modules non présent"
                    
                    echo "9. Test EXÉCUTION dans conteneur:"
                    docker exec ${env.CONTAINER_NAME} node -e "console.log('Node fonctionne'); console.log('Version:', process.version)" 2>&1 || echo "Node non fonctionnel"
                    """
                }
            }
        }

        stage('5. Smoke Test DEBUG') {
            steps {
                script {
                    bat """
                    echo "=== SMOKE TEST AVANCÉ ==="
                    
                    echo "1. Vérification port ${env.HOST_PORT}:"
                    netstat -ano | findstr :${env.HOST_PORT} && echo "✅ Port ouvert" || echo "❌ Port fermé"
                    
                    echo "2. Test curl direct:"
                    curl -v --max-time 10 http://localhost:${env.HOST_PORT} 2>&1 || echo "Curl échoué"
                    
                    echo "3. Test avec PowerShell détaillé:"
                    powershell -Command "
                    Write-Host '=== TEST POWERSHELL ==='
                    
                    # Vérifier si le port écoute
                    \$portTest = Test-NetConnection -ComputerName localhost -Port ${env.HOST_PORT} -WarningAction SilentlyContinue
                    Write-Host \"Port ${env.HOST_PORT} TCP ouvert: \$(\$portTest.TcpTestSucceeded)\"
                    
                    if (\$portTest.TcpTestSucceeded) {
                        Write-Host 'Port ouvert, tentative HTTP...'
                        try {
                            \$response = Invoke-WebRequest -Uri 'http://localhost:${env.HOST_PORT}' -UseBasicParsing -TimeoutSec 10
                            Write-Host \"✅ HTTP Status: \$(\$response.StatusCode)\"
                            Write-Host \"Contenu (100 premiers chars): \$(\$response.Content.Substring(0, [Math]::Min(100, \$response.Content.Length)))\"
                        } catch {
                            Write-Host \"❌ HTTP Error: \$(\$_.Exception.Message)\"
                            Write-Host \"Détails: \$(\$_.Exception)\"
                        }
                    } else {
                        Write-Host '❌ Port non accessible'
                        
                        # Debug Docker
                        Write-Host '=== DOCKER DEBUG ==='
                        \$logs = docker logs ${env.CONTAINER_NAME} 2>&1
                        Write-Host \"Logs Docker:\\n\$logs\"
                        
                        \$containerState = docker inspect ${env.CONTAINER_NAME} --format='{{.State.Status}}' 2>&1
                        Write-Host \"État conteneur: \$containerState\"
                    }
                    "
                    
                    echo "4. Test depuis l'INTÉRIEUR du conteneur:"
                    docker exec ${env.CONTAINER_NAME} sh -c "
                    echo 'Test interne dans conteneur...'
                    
                    # Vérifier si node tourne
                    ps aux | grep node | grep -v grep
                    
                    # Tester l'application
                    if command -v curl >/dev/null 2>&1; then
                        echo 'Test avec curl:'
                        curl -s http://localhost:${env.CONTAINER_PORT} || echo 'Curl échoué'
                    elif command -v wget >/dev/null 2>&1; then
                        echo 'Test avec wget:'
                        wget -qO- http://localhost:${env.CONTAINER_PORT} || echo 'Wget échoué'
                    else
                        echo 'Installation curl...'
                        apk add --no-cache curl 2>/dev/null || apt-get update && apt-get install -y curl 2>/dev/null
                        curl -s http://localhost:${env.CONTAINER_PORT} || echo 'Échec après installation curl'
                    fi
                    " 2>&1 || echo "Test interne impossible"
                    """
                }
            }
        }

        stage('6. Fix Automatique') {
            when {
                expression { currentBuild.result == null || currentBuild.result == 'FAILURE' }
            }
            steps {
                script {
                    bat """
                    echo "=== TENTATIVE DE RÉPARATION ==="
                    
                    echo "1. Arrêt conteneur:"
                    docker stop ${env.CONTAINER_NAME} 2>nul || echo OK
                    
                    echo "2. Modification Dockerfile pour debug:"
                    copy Dockerfile Dockerfile.backup
                    
                    echo "3. Création Dockerfile debug:"
                    (
                    echo FROM node:18-alpine
                    echo WORKDIR /app
                    echo COPY package*.json ./
                    echo RUN npm install
                    echo COPY . .
                    echo RUN echo "=== FICHIERS DANS /app ===" ^&^& ls -la
                    echo RUN echo "=== NODE_MODULES ===" ^&^& ls -la node_modules || echo "Pas de node_modules"
                    echo RUN echo "=== SERVER.JS ===" ^&^& cat server.js | head -20
                    echo EXPOSE 3000
                    echo CMD ["sh", "-c", "echo 'Démarrage...' && npm start || (echo 'npm start échoué' && ps aux && sleep 3600)"]
                    ) > Dockerfile
                    
                    echo "4. Rebuild:"
                    docker build --no-cache -t ${env.DOCKER_IMAGE}-debug .
                    
                    echo "5. Run avec shell interactif:"
                    docker run -d -p ${env.HOST_PORT}:3000 --name ${env.CONTAINER_NAME}-debug ${env.DOCKER_IMAGE}-debug
                    
                    timeout /t 10 /nobreak
                    
                    echo "6. Logs debug:"
                    docker logs ${env.CONTAINER_NAME}-debug --tail 100
                    """
                }
            }
        }

        stage('7. Archive Logs') {
            steps {
                script {
                    bat """
                    echo "=== COLLECTE DE LOGS ==="
                    
                    docker logs ${env.CONTAINER_NAME} 2>nul > docker_logs.txt || echo "Pas de logs" > docker_logs.txt
                    docker inspect ${env.CONTAINER_NAME} 2>nul > docker_inspect.txt || echo "Pas d'inspection" > docker_inspect.txt
                    netstat -ano > netstat.txt
                    
                    echo "=== RÉSUMÉ ==="
                    echo "Build: ${BUILD_NUMBER}" > summary.txt
                    echo "Time: %DATE% %TIME%" >> summary.txt
                    docker ps -a --format="table {{.Names}}\\t{{.Status}}\\t{{.Ports}}" >> summary.txt 2>nul || echo "docker ps échoué" >> summary.txt
                    """
                    
                    archiveArtifacts artifacts: 'docker_logs.txt, docker_inspect.txt, netstat.txt, summary.txt, docker_build.log', allowEmptyArchive: true
                }
            }
        }
    }

    post {
        always {
            // Nettoyage
            bat """
            echo "=== NETTOYAGE FINAL ==="
            docker stop ${env.CONTAINER_NAME} ${env.CONTAINER_NAME}-debug 2>nul || echo OK
            docker rm ${env.CONTAINER_NAME} ${env.CONTAINER_NAME}-debug 2>nul || echo OK
            docker rmi ${env.DOCKER_IMAGE} ${env.DOCKER_IMAGE}-debug 2>nul || echo OK
            """
            cleanWs()
        }
        
        success {
            bat 'echo "✅ PIPELINE TERMINÉ AVEC SUCCÈS"'
        }
        
        failure {
            bat 'echo "❌ PIPELINE EN ÉCHEC - CONSULTEZ LES LOGS"'
        }
    }
}
