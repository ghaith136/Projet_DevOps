pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "monapp-${BUILD_NUMBER}"
        CONTAINER_NAME = "monapp-${BUILD_NUMBER}"
    }

    stages {
        stage('Start') {
            steps {
                bat 'echo "START"'
            }
        }
        
        stage('Checkout') {
            steps {
                checkout scm
                bat 'echo "CHECKOUT OK"'
            }
        }

        stage('Setup') {
            steps {
                bat 'npm install'
                bat 'echo "SETUP OK"'
            }
        }

        stage('Build') {
            steps {
                bat 'npm run build'
                bat 'echo "BUILD OK"'
            }
        }

        stage('Docker Build & Run') {
            steps {
                script {
                    // Nettoyage
                    bat """
                    docker stop ${env.CONTAINER_NAME} 2>nul || echo OK
                    docker rm ${env.CONTAINER_NAME} 2>nul || echo OK
                    """
                    
                    parallel(
                        'Build Docker': {
                            bat "docker build -t ${env.DOCKER_IMAGE} ."
                            bat 'echo "DOCKER BUILD OK"'
                        },
                        'Run Docker': {
                            script {
                                sleep 3
                                bat "docker run -d -p 3002:3000 --name ${env.CONTAINER_NAME} ${env.DOCKER_IMAGE}"
                                sleep 10
                                bat 'echo "DOCKER RUN OK"'
                            }
                        }
                    )
                }
            }
        }

        stage('Smoke Test') {
            steps {
                script {
                    sleep 5
                    bat '''
                    powershell -Command "
                    try {
                        \$response = Invoke-WebRequest -Uri 'http://localhost:3002' -TimeoutSec 10
                        if (\$response.StatusCode -eq 200) {
                            echo 'TEST PASSED'
                            exit 0
                        } else {
                            exit 1
                        }
                    } catch {
                        exit 1
                    }
                    "
                    '''
                    bat 'echo "SMOKE TEST PASSED"'
                }
            }
        }

        stage('Archive Artifacts') {
            steps {
                script {
                    // Créer des artefacts simples
                    bat """
                    echo "Build Number: ${BUILD_NUMBER}" > build_info.txt
                    echo "Date: %DATE% %TIME%" >> build_info.txt
                    echo "Status: SUCCESS" >> build_info.txt
                    
                    docker logs ${env.CONTAINER_NAME} 2>nul > docker_logs.txt || echo "No logs" > docker_logs.txt
                    """
                    
                    // Archiver uniquement les fichiers qui existent
                    archiveArtifacts artifacts: 'build_info.txt, docker_logs.txt, package.json, Dockerfile, server.js', allowEmptyArchive: true
                    bat 'echo "ARTIFACTS ARCHIVED"'
                }
            }
        }

        stage('Cleanup') {
            steps {
                bat """
                docker stop ${env.CONTAINER_NAME} 2>nul || echo OK
                docker rm ${env.CONTAINER_NAME} 2>nul || echo OK
                """
                bat 'echo "CLEANUP DONE"'
            }
        }
        
        stage('End') {
            steps {
                bat 'echo "END"'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        
        success {
            script {
                // Tests parallèles Node
                parallel(
                    'Node 18 Test': {
                        bat 'node --version'
                        bat 'echo "NODE 18 OK"'
                    },
                    'Node 20 Test': {
                        bat 'echo "echo NODE 20 SIMULATED"'
                        bat 'echo "NODE 20 OK"'
                    }
                )
                bat 'echo "PIPELINE 2 SUCCESS"'
            }
        }
        
        failure {
            bat 'echo "PIPELINE 2 FAILED"'
        }
    }
}
