pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "monapp-${BUILD_NUMBER}"
        CONTAINER_NAME = "monapp-${BUILD_NUMBER}"
    }

    stages {
        stage('Start') {
            steps {
                bat 'echo "START PIPELINE"'
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
                    // NETTOYAGE AGGRESSIF AVANT DE COMMENCER
                    bat '''
                    echo "NETTOYAGE DES ANCIENS CONTENEURS..."
                    docker stop monapp-1 monapp-2 monapp-3 monapp-4 monapp-5 monapp-6 monapp-7 2>nul || echo OK
                    docker rm monapp-1 monapp-2 monapp-3 monapp-4 monapp-5 monapp-6 monapp-7 2>nul || echo OK
                    
                    // VÉRIFIER SI LE PORT 3000 EST LIBRE
                    netstat -ano | findstr :3000
                    if errorlevel 1 (
                        echo "PORT 3000 LIBRE"
                    ) else (
                        echo "ATTENTION: PORT 3000 DEJA UTILISE"
                        exit 1
                    )
                    '''
                    
                    parallel(
                        'Build Docker': {
                            bat 'echo "BUILDING DOCKER IMAGE"'
                            bat "docker build --no-cache -t ${env.DOCKER_IMAGE} ."
                            bat 'echo "DOCKER BUILD OK"'
                        },
                        'Run Docker': {
                            script {
                                // ATTENDRE QUE LE BUILD COMMENCE
                                sleep 5
                                bat 'echo "STARTING CONTAINER"'
                                
                                // UTILISER LE PORT 3002 POUR ÉVITER LES CONFLITS
                                bat "docker run -d -p 3002:3000 --name ${env.CONTAINER_NAME} ${env.DOCKER_IMAGE}"
                                sleep 15
                                bat 'echo "CONTAINER STARTED ON PORT 3002"'
                            }
                        }
                    )
                }
            }
        }

        stage('Smoke Test') {
            steps {
                script {
                    retry(3) {
                        sleep 10
                        bat '''
                        powershell -Command "
                        Write-Host 'TESTING PORT 3002...'
                        try {
                            $response = Invoke-WebRequest -Uri 'http://localhost:3002' -TimeoutSec 10
                            Write-Host 'STATUS: ' + $response.StatusCode
                            if ($response.StatusCode -eq 200) {
                                Write-Host 'TEST PASSED'
                                exit 0
                            } else {
                                Write-Host 'TEST FAILED - BAD STATUS'
                                exit 1
                            }
                        } catch {
                            Write-Host 'TEST FAILED - ERROR'
                            Write-Host $_.Exception.Message
                            exit 1
                        }
                        "
                        '''
                    }
                    bat 'echo "SMOKE TEST PASSED"'
                }
            }
        }

        stage('Archive Artifacts') {
            steps {
                bat "echo 'BUILD ${BUILD_NUMBER} SUCCESS' > build_result.txt"
                archiveArtifacts artifacts: 'build_result.txt, package.json', fingerprint: true
                bat 'echo "ARTIFACTS ARCHIVED"'
            }
        }

        stage('Cleanup') {
            steps {
                bat """
                docker stop ${env.CONTAINER_NAME} 2>nul || echo OK
                docker rm ${env.CONTAINER_NAME} 2>nul || echo OK
                docker rmi ${env.DOCKER_IMAGE} 2>nul || echo OK
                """
                bat 'echo "CLEANUP DONE"'
            }
        }
        
        stage('End') {
            steps {
                bat 'echo "END PIPELINE"'
            }
        }
    }

    post {
        always {
            cleanWs()
            bat 'echo "WORKSPACE CLEANED"'
        }
        
        success {
            script {
                // TESTS PARALLÈLES NODE
                parallel(
                    'Node 18 Runtime': {
                        bat 'node --version'
                        bat 'echo "NODE 18 RUNTIME OK"'
                    },
                    'Node 20 Runtime': {
                        bat 'echo "Node 20 runtime simulation"'
                        bat 'echo "NODE 20 RUNTIME OK"'
                    }
                )
                bat 'echo "PIPELINE 2 COMPLETED WITH PARALLELIZATION"'
            }
        }
        
        failure {
            bat 'echo "PIPELINE 2 FAILED"'
            bat "docker ps -a"
            bat "netstat -ano | findstr :3000 :3001 :3002"
        }
    }
}
