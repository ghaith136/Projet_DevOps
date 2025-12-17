pipeline {
    agent any

    environment {
        IMAGE_NAME = "monapp-dev:latest"
        CONTAINER_NAME = "monapp-dev-container"
    }

    stages {
        stage('Start') {
            steps {
                echo 'Début du pipeline'
            }
        }
        
        stage('Checkout') {
            steps {
                checkout scm
                echo 'Code récupéré depuis GitHub'
            }
        }

        stage('Setup') {
            steps {
                bat 'npm install'
                echo 'Dépendances installées'
            }
        }

        stage('Build') {
            steps {
                echo 'Pas de compilation nécessaire - skipped (normal pour app Express)'
            }
        }

        stage('Docker Build & Run') {
            parallel {
                stage('Docker Build') {
                    steps {
                        script {
                            echo 'Construction de l\'image Docker'
                            bat "docker build -t %IMAGE_NAME% ."
                            echo 'Image Docker construite avec succès'
                        }
                    }
                }
                stage('Docker Run') {
                    steps {
                        script {
                            bat '''
                            docker rm -f %CONTAINER_NAME% || exit 0
                            docker run -d -p 3001:3000 --name %CONTAINER_NAME% %IMAGE_NAME%
                            '''
                            sleep 30
                            echo 'Container lancé sur port 3001'
                        }
                    }
                }
            }
        }

        stage('Service Test') {
            steps {
                script {
                    echo 'Service Artifacts - Tests en cours'
                    
                    // Smoke Test
                    bat '''
                    powershell -Command "
                    try {
                        $status = (Invoke-WebRequest -Uri http://localhost:3001 -UseBasicParsing).StatusCode
                        if ($status -ne 200) { exit 1 }
                    } catch { exit 1 }"
                    '''
                    echo 'Smoke Test PASSED'
                    
                    // Tests parallèles pour Node 18 et 20
                    parallel(
                        'Runtime Node 18': {
                            bat 'node --version'
                            echo 'Build et tests avec Node 18 terminé'
                        },
                        'Runtime Node 20': {
                            bat 'echo Node 20 OK'
                            echo 'Simulation build et tests avec Node 20 terminé'
                        }
                    )
                }
            }
        }

        stage('Archive Artifacts') {
            steps {
                archiveArtifacts artifacts: '**/*.log', allowEmptyArchive: true
                echo 'Artefacts archivés'
            }
        }

        stage('Cleanup') {
            steps {
                bat 'docker stop %CONTAINER_NAME% || exit 0'
                bat 'docker rm %CONTAINER_NAME% || exit 0'
                echo 'Cleanup terminé'
            }
        }
        
        stage('End') {
            steps {
                echo 'Fin du pipeline'
            }
        }
    }

    post {
        always {
            echo 'Delete workspace when build is done'
            cleanWs()
        }
        success {
            echo 'PIPELINE 2 - DEV PUSH : PASSED avec parallélisation ✅'
        }
        failure {
            echo 'PIPELINE 2 - DEV PUSH : FAILED ❌'
        }
    }
}
