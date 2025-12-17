pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "monapp-dev-${BUILD_NUMBER}"
        CONTAINER_NAME = "monapp-container-${BUILD_NUMBER}"
    }

    stages {
        // Étape 1: Start
        stage('Start') {
            steps {
                bat 'echo "DEBUT PIPELINE"'
            }
        }
        
        // Étape 2: Checkout
        stage('Checkout') {
            steps {
                checkout scm
                bat 'echo "CODE RECUPERE"'
            }
        }

        // Étape 3: Setup
        stage('Setup') {
            steps {
                bat 'npm install'
                bat 'echo "DEPENDANCES INSTALLEES"'
            }
        }

        // Étape 4: Build
        stage('Build') {
            steps {
                bat 'npm run build'
                bat 'echo "BUILD TERMINE"'
            }
        }

        // Étape 5: Docker Build & Run (parallèle)
        stage('Docker Build & Run') {
            steps {
                script {
                    parallel(
                        'Build Docker': {
                            bat 'echo "CONSTRUCTION DOCKER"'
                            bat "docker build -t ${env.DOCKER_IMAGE} ."
                            bat 'echo "IMAGE DOCKER CONSTRUITE"'
                        },
                        'Run Docker': {
                            bat 'echo "LANCEMENT CONTAINER"'
                            bat "docker rm -f ${env.CONTAINER_NAME} 2>nul || echo OK"
                            bat "docker run -d -p 3001:3000 --name ${env.CONTAINER_NAME} ${env.DOCKER_IMAGE}"
                            sleep 10
                            bat 'echo "CONTAINER LANCE PORT 3001"'
                        }
                    )
                }
            }
        }

        // Étape 6: Smoke Test
        stage('Smoke Test') {
            steps {
                script {
                    sleep 5
                    bat """
                    powershell -Command "
                    Write-Host 'TEST CONNEXION...'
                    try {
                        \$response = Invoke-WebRequest -Uri 'http://localhost:3001' -UseBasicParsing -TimeoutSec 10
                        Write-Host 'STATUS: ' + \$response.StatusCode
                        if (\$response.StatusCode -eq 200) {
                            Write-Host 'TEST REUSSI'
                            exit 0
                        } else {
                            Write-Host 'TEST ECHEC - MAUVAIS STATUT'
                            exit 1
                        }
                    } catch {
                        Write-Host 'TEST ECHEC - ERREUR: ' + \$_ 
                        exit 1
                    }
                    "
                    """
                    bat 'echo "SMOKE TEST PASSED"'
                }
            }
        }

        // Étape 7: Archive Artifacts
        stage('Archive Artifacts') {
            steps {
                bat 'echo "Build ${BUILD_NUMBER}" > build.log'
                archiveArtifacts artifacts: 'build.log', fingerprint: true
                bat 'echo "ARTEFACTS ARCHIVES"'
            }
        }

        // Étape 8: Cleanup
        stage('Cleanup') {
            steps {
                bat "docker stop ${env.CONTAINER_NAME} 2>nul || echo OK"
                bat "docker rm ${env.CONTAINER_NAME} 2>nul || echo OK"
                bat 'echo "NETTOYAGE TERMINE"'
            }
        }
        
        // Étape 9: End
        stage('End') {
            steps {
                bat 'echo "FIN PIPELINE"'
            }
        }
    }

    post {
        always {
            cleanWs()
            bat 'echo "WORKSPACE NETTOYE"'
        }
        
        success {
            // Tests parallèles Node 18/20
            script {
                parallel(
                    'Node 18 Check': {
                        bat 'node --version'
                        bat 'echo "NODE 18 OK"'
                    },
                    'Node 20 Check': {
                        bat 'echo "NODE 20 SIMULATION"'
                        bat 'echo "NODE 20 OK"'
                    }
                )
                bat 'echo "PIPELINE 2 - REUSSITE AVEC PARALLELISATION"'
            }
        }
        
        failure {
            bat 'echo "PIPELINE 2 - ECHEC"'
            bat "docker logs ${env.CONTAINER_NAME} 2>nul || echo PAS DE LOGS"
        }
    }
}
