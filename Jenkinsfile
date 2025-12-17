pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        APP_NAME = "mon_app"
        DOCKER_IMAGE = "mon_app:${BUILD_NUMBER}"
        CONTAINER_NAME = "mon_app_${BUILD_NUMBER}"
    }

    stages {
        // PREMIÈRE LIGNE : Start -> Checkout -> Setup -> Build
        stage('Start') {
            steps {
                echo '=== DÉBUT PIPELINE ==='
            }
        }
        
        stage('Checkout') {
            steps {
                echo 'Checkout du code source'
                checkout scm
            }
        }

        stage('Setup') {
            steps {
                echo 'Installation des dépendances'
                bat 'npm install'
            }
        }

        stage('Build') {
            steps {
                echo 'Build de l application'
                bat 'npm run build'
            }
        }

        // DEUXIÈME LIGNE : Docker Build & Run (parallèle)
        stage('Docker Build & Run') {
            steps {
                script {
                    parallel(
                        'Build Docker': {
                            echo 'Construction de l image Docker'
                            bat "docker build -t ${env.DOCKER_IMAGE} ."
                        },
                        'Run Docker': {
                            echo 'Lancement du container Docker'
                            script {
                                bat "docker rm -f ${env.CONTAINER_NAME} 2>nul || echo OK"
                                bat "docker run -d -p 3001:3000 --name ${env.CONTAINER_NAME} ${env.DOCKER_IMAGE}"
                                sleep 20
                            }
                        }
                    )
                }
            }
        }

        // TROISIÈME LIGNE : Tests et nettoyage
        stage('Smoke Test') {
            steps {
                echo 'Smoke Test en cours'
                
                script {
                    retry(3) {
                        sleep 10
                        bat """
                        powershell -Command "
                        try {
                            \$response = Invoke-WebRequest -Uri 'http://localhost:3001' -UseBasicParsing -TimeoutSec 15
                            echo 'STATUS: ' + \$response.StatusCode
                            if (\$response.StatusCode -eq 200) {
                                echo 'SMOKE TEST PASSED'
                                exit 0
                            } else {
                                echo 'SMOKE TEST FAILED - Bad status'
                                exit 1
                            }
                        } catch {
                            echo 'SMOKE TEST FAILED - Connection error'
                            exit 1
                        }"
                        """
                    }
                }
            }
        }

        stage('Archive Artifacts') {
            steps {
                echo 'Archivage des artefacts'
                script {
                    // Créer un fichier de log simple
                    bat 'echo "Build ${BUILD_NUMBER} completed at %DATE% %TIME%" > build_info.txt'
                    archiveArtifacts artifacts: 'build_info.txt, package.json, Dockerfile', fingerprint: true
                }
            }
        }

        stage('Cleanup') {
            steps {
                echo 'Nettoyage Docker'
                bat """
                docker stop ${env.CONTAINER_NAME} 2>nul || echo OK
                docker rm ${env.CONTAINER_NAME} 2>nul || echo OK
                """
            }
        }
        
        stage('End') {
            steps {
                echo '=== FIN PIPELINE ==='
            }
        }
    }

    post {
        always {
            echo 'Nettoyage workspace'
            cleanWs()
        }
        
        success {
            echo 'PIPELINE 2 - REUSSITE'
            
            // Tests parallèles Node dans post-success
            script {
                parallel(
                    'Runtime Node 18': {
                        bat 'node --version'
                        echo 'Node 18 verifie'
                    },
                    'Runtime Node 20': {
                        bat 'echo "Node 20 simulation"'
                        echo 'Node 20 simule'
                    }
                )
            }
        }
        
        failure {
            echo 'PIPELINE 2 - ECHEC'
            
            script {
                // Logs de débogage en cas d'échec
                bat """
                echo "=== LOGS DOCKER ==="
                docker logs ${env.CONTAINER_NAME} 2>nul || echo "Pas de logs"
                echo "=== CONTAINERS ==="
                docker ps -a
                """
            }
        }
    }
}
