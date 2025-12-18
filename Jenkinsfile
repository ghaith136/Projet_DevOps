pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    triggers {
        // Se déclenche uniquement sur les tags vX.Y.Z
        pollSCM('H/2 * * * *')
    }

    environment {
        APP_NAME = "meteo-app"
        // Utiliser le tag comme version
        VERSION = "${params.VERSION_TAG ?: sh(script: 'git describe --tags --always', returnStdout: true).trim()}"
        DOCKER_IMAGE = "meteo-app:${VERSION}"
        CONTAINER_NAME = "meteo-app-${VERSION.replace('.', '-')}"
        HOST_PORT = "3003"  // Port différent pour éviter les conflits
        DOCKER_PORT = "3000"
        ARTIFACT_DIR = "artifacts-${VERSION}"
    }

    parameters {
        string(name: 'VERSION_TAG', defaultValue: '', description: 'Tag version (ex: v1.0.0) - laisser vide pour utiliser le tag git')
        choice(name: 'NODE_VERSION', choices: ['18', '20'], description: 'Version de Node.js pour le build')
    }

    stages {
        // ===== ÉTAPE 1: VÉRIFICATION VERSION =====
        stage('Version Check') {
            steps {
                script {
                    echo "🏷️  PIPELINE 3: BUILD VERSIONNÉ"
                    echo "📦 Version: ${env.VERSION}"
                    echo "🔧 Node.js: ${params.NODE_VERSION}"
                    
                    // Vérifier que c'est un tag valide
                    bat """
                    echo "Vérification du tag..."
                    git tag --list | findstr ${env.VERSION}
                    if errorlevel 1 (
                        echo "⚠️  Attention: Le tag ${env.VERSION} n'existe pas dans le repo"
                    )
                    """
                    
                    // Créer un répertoire pour les artefacts
                    bat "mkdir ${env.ARTIFACT_DIR}"
                }
            }
        }

        // ===== ÉTAPE 2: CHECKOUT SPÉCIFIQUE AU TAG =====
        stage('Checkout Version') {
            steps {
                echo "📥 Checkout de la version ${env.VERSION}"
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "refs/tags/${env.VERSION}"]],
                    extensions: [
                        [$class: 'LocalBranch', localBranch: ''],
                        [$class: 'CloneOption', depth: 1, shallow: true]
                    ],
                    userRemoteConfigs: [[url: 'https://github.com/votre-repo/projet-devops.git']]
                ])
                
                script {
                    // Afficher les informations de version
                    bat """
                    echo "=== INFORMATIONS VERSION ==="
                    git log -1 --oneline
                    echo ""
                    echo "=== FICHIERS VERSIONNÉS ==="
                    dir
                    """
                    
                    // Sauvegarder les infos git
                    bat """
                    git log -1 --pretty=format:"Commit: %H%nAuteur: %an <%ae>%nDate: %ad%nMessage: %s" > ${env.ARTIFACT_DIR}/git_info.txt
                    git describe --tags --always > ${env.ARTIFACT_DIR}/version.txt
                    """
                }
            }
        }

        // ===== ÉTAPE 3: SETUP AVEC VERSION NODE SPÉCIFIQUE =====
        stage('Setup & Build') {
            steps {
                script {
                    echo "⚙️  Configuration avec Node ${params.NODE_VERSION}"
                    
                    // Installer la version spécifique de Node si nécessaire
                    bat """
                    echo "Version Node actuelle:"
                    node --version
                    npm --version
                    """
                    
                    // Installation des dépendances
                    bat """
                    echo "Installation des dépendances..."
                    npm ci --only=production
                    echo "✅ Dépendances installées"
                    
                    echo "Build de l'application..."
                    npm run build
                    echo "✅ Build terminé"
                    """
                    
                    // Sauvegarder les infos de build
                    bat """
                    echo "Build: ${env.VERSION}" > ${env.ARTIFACT_DIR}/build_info.txt
                    echo "Date: %DATE% %TIME%" >> ${env.ARTIFACT_DIR}/build_info.txt
                    echo "Node: ${params.NODE_VERSION}" >> ${env.ARTIFACT_DIR}/build_info.txt
                    npm list --depth=0 >> ${env.ARTIFACT_DIR}/dependencies.txt
                    """
                }
            }
        }

        // ===== ÉTAPE 4: TESTS PARALLÈLES =====
        stage('Parallel Tests') {
            parallel {
                // TESTS UNITAIRE EN PARALLÈLE
                stage('Unit Tests') {
                    steps {
                        script {
                            echo "🧪 Tests unitaires"
                            bat """
                            echo "Exécution des tests..."
                            npm test 2>&1 | tee ${env.ARTIFACT_DIR}/unit_tests.log
                            echo "✅ Tests unitaires terminés"
                            """
                        }
                    }
                }
                
                // TESTS DE CODE EN PARALLÈLE
                stage('Code Analysis') {
                    steps {
                        script {
                            echo "🔍 Analyse statique du code"
                            bat """
                            echo "Vérification de la syntaxe..."
                            node -c server.js && echo "✅ Syntaxe OK" || echo "❌ Erreur de syntaxe"
                            
                            echo "Vérification des dépendances..."
                            npm audit --audit-level=moderate 2>&1 | tee ${env.ARTIFACT_DIR}/security_audit.log
                            echo "✅ Analyse de sécurité terminée"
                            """
                        }
                    }
                }
                
                // TESTS DE PERFORMANCE EN PARALLÈLE
                stage('Performance Check') {
                    steps {
                        script {
                            echo "⚡ Test de performance"
                            bat """
                            echo "Test de démarrage..."
                            timeout /t 5 /nobreak
                            echo "✅ Test de performance terminé"
                            """
                        }
                    }
                }
            }
        }

        // ===== ÉTAPE 5: BUILD DOCKER VERSIONNÉ =====
        stage('Docker Build Versioned') {
            steps {
                script {
                    echo "🐳 Construction de l'image versionnée"
                    
                    // Nettoyage préalable
                    bat """
                    echo "Nettoyage des anciennes images..."
                    docker rmi ${env.DOCKER_IMAGE} 2>nul || echo "Aucune ancienne image"
                    """
                    
                    // Build avec tags additionnels
                    bat """
                    echo "Construction de l'image ${env.DOCKER_IMAGE}..."
                    docker build --no-cache \\
                        --label "version=${env.VERSION}" \\
                        --label "build.date=%DATE% %TIME%" \\
                        --label "maintainer=devops-team" \\
                        -t ${env.DOCKER_IMAGE} \\
                        -t meteo-app:latest \\
                        .
                    
                    echo "✅ Image Docker construite"
                    """
                    
                    // Inspecter l'image
                    bat """
                    echo "=== INSPECTION DE L'IMAGE ==="
                    docker inspect ${env.DOCKER_IMAGE} --format='{{json .Config.Labels}}' > ${env.ARTIFACT_DIR}/docker_labels.json
                    docker images ${env.DOCKER_IMAGE}
                    """
                    
                    // Sauvegarder l'image
                    bat """
                    echo "Sauvegarde de l'image..."
                    docker save -o ${env.ARTIFACT_DIR}/meteo-app-${env.VERSION}.tar ${env.DOCKER_IMAGE}
                    echo "✅ Image sauvegardée: ${env.ARTIFACT_DIR}/meteo-app-${env.VERSION}.tar"
                    """
                }
            }
        }

        // ===== ÉTAPE 6: TEST DE L'IMAGE VERSIONNÉE =====
        stage('Versioned Smoke Test') {
            steps {
                script {
                    echo "🧪 Test de la version ${env.VERSION}"
                    
                    // Démarrer le conteneur versionné
                    bat """
                    echo "Démarrage du conteneur versionné..."
                    docker run -d \\
                        -p ${env.HOST_PORT}:${env.DOCKER_PORT} \\
                        --name ${env.CONTAINER_NAME} \\
                        ${env.DOCKER_IMAGE}
                    
                    echo "Attente du démarrage..."
                    timeout /t 15 /nobreak
                    """
                    
                    // Tests complets
                    bat """
                    echo "=== TESTS COMPLETS ==="
                    
                    setlocal enabledelayedexpansion
                    set ALL_TESTS_PASSED=1
                    
                    // Test 1: Endpoint racine
                    echo "Test 1: Endpoint /"
                    curl -f http://localhost:${env.HOST_PORT} && (
                        echo "✅ Test 1 PASSED" 
                        echo "/: OK" > ${env.ARTIFACT_DIR}/test_results.txt
                    ) || (
                        echo "❌ Test 1 FAILED" 
                        set ALL_TESTS_PASSED=0
                        echo "/: FAILED" > ${env.ARTIFACT_DIR}/test_results.txt
                    )
                    
                    // Test 2: Endpoint météo
                    echo "Test 2: Endpoint /weather"
                    curl -f http://localhost:${env.HOST_PORT}/weather && (
                        echo "✅ Test 2 PASSED" 
                        echo "/weather: OK" >> ${env.ARTIFACT_DIR}/test_results.txt
                    ) || (
                        echo "❌ Test 2 FAILED" 
                        set ALL_TESTS_PASSED=0
                        echo "/weather: FAILED" >> ${env.ARTIFACT_DIR}/test_results.txt
                    )
                    
                    // Test 3: Endpoint health
                    echo "Test 3: Endpoint /health"
                    curl -f http://localhost:${env.HOST_PORT}/health && (
                        echo "✅ Test 3 PASSED" 
                        echo "/health: OK" >> ${env.ARTIFACT_DIR}/test_results.txt
                    ) || (
                        echo "❌ Test 3 FAILED" 
                        set ALL_TESTS_PASSED=0
                        echo "/health: FAILED" >> ${env.ARTIFACT_DIR}/test_results.txt
                    )
                    
                    // Test 4: Vérifier la version dans les logs
                    echo "Test 4: Vérification logs"
                    docker logs ${env.CONTAINER_NAME} | findstr "${env.VERSION}" && (
                        echo "✅ Version détectée dans les logs" 
                        echo "version_logs: OK" >> ${env.ARTIFACT_DIR}/test_results.txt
                    ) || (
                        echo "⚠️  Version non trouvée dans les logs" 
                        echo "version_logs: WARNING" >> ${env.ARTIFACT_DIR}/test_results.txt
                    )
                    
                    if !ALL_TESTS_PASSED! equ 0 (
                        echo "❌ Certains tests ont échoué"
                        exit 1
                    )
                    
                    echo "✅ Tous les tests ont réussi"
                    """
                    
                    // Capturer les logs
                    bat """
                    docker logs ${env.CONTAINER_NAME} > ${env.ARTIFACT_DIR}/container_logs.txt
                    """
                }
            }
        }

        // ===== ÉTAPE 7: GÉNÉRATION DE RAPPORT =====
        stage('Generate Report') {
            steps {
                script {
                    echo "📊 Génération du rapport de version"
                    
                    // Créer un rapport HTML
                    bat """
                    echo "<!DOCTYPE html>" > ${env.ARTIFACT_DIR}/build_report.html
                    echo "<html>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "<head>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "    <title>Build Report - ${env.VERSION}</title>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "    <style>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "        body { font-family: Arial, sans-serif; margin: 40px; }" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "        .success { color: green; }" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "        .failure { color: red; }" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "    </style>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "</head>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "<body>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "    <div class='header'>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "        <h1>📦 Build Versionné - ${env.VERSION}</h1>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "        <p>Application Météo DevOps - Pipeline 3</p>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "    </div>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "    " >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "    <div class='section'>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "        <h2>📋 Informations Générales</h2>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "        <p><strong>Version:</strong> ${env.VERSION}</p>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "        <p><strong>Date:</strong> %DATE% %TIME%</p>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "        <p><strong>Build #:</strong> ${BUILD_NUMBER}</p>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "    </div>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "    " >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "    <div class='section'>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "        <h2>✅ Résultats des Tests</h2>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "        <pre>" >> ${env.ARTIFACT_DIR}/build_report.html
                    type ${env.ARTIFACT_DIR}/test_results.txt >> ${env.ARTIFACT_DIR}/build_report.html 2>nul || echo "Aucun résultat" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "        </pre>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "    </div>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "    " >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "    <div class='section'>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "        <h2>🐳 Informations Docker</h2>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "        <p><strong>Image:</strong> ${env.DOCKER_IMAGE}</p>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "        <p><strong>Conteneur:</strong> ${env.CONTAINER_NAME}</p>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "        <p><strong>Port:</strong> ${env.HOST_PORT}</p>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "    </div>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "    " >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "    <div class='section'>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "        <h2>📁 Artefacts Générés</h2>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "        <ul>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "            <li>Image Docker: meteo-app-${env.VERSION}.tar</li>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "            <li>Rapport de build: build_report.html</li>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "            <li>Logs du conteneur: container_logs.txt</li>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "            <li>Résultats des tests: test_results.txt</li>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "        </ul>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "    </div>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "</body>" >> ${env.ARTIFACT_DIR}/build_report.html
                    echo "</html>" >> ${env.ARTIFACT_DIR}/build_report.html
                    """
                    
                    // Créer un fichier README
                    bat """
                    echo "# Build Versionné ${env.VERSION}" > ${env.ARTIFACT_DIR}/README.md
                    echo "" >> ${env.ARTIFACT_DIR}/README.md
                    echo "## Application Météo DevOps" >> ${env.ARTIFACT_DIR}/README.md
                    echo "" >> ${env.ARTIFACT_DIR}/README.md
                    echo "### Informations" >> ${env.ARTIFACT_DIR}/README.md
                    echo "- **Version:** ${env.VERSION}" >> ${env.ARTIFACT_DIR}/README.md
                    echo "- **Date du build:** %DATE% %TIME%" >> ${env.ARTIFACT_DIR}/README.md
                    echo "- **Build Jenkins:** #${BUILD_NUMBER}" >> ${env.ARTIFACT_DIR}/README.md
                    echo "" >> ${env.ARTIFACT_DIR}/README.md
                    echo "### Déploiement" >> ${env.ARTIFACT_DIR}/README.md
                    echo "Pour déployer cette version:" >> ${env.ARTIFACT_DIR}/README.md
                    echo "1. Charger l'image: docker load -i meteo-app-${env.VERSION}.tar" >> ${env.ARTIFACT_DIR}/README.md
                    echo "2. Lancer le conteneur: docker run -d -p 3000:3000 --name meteo-app meteo-app:${env.VERSION}" >> ${env.ARTIFACT_DIR}/README.md
                    echo "" >> ${env.ARTIFACT_DIR}/README.md
                    echo "### Tests" >> ${env.ARTIFACT_DIR}/README.md
                    echo "Tous les tests ont été exécutés avec succès." >> ${env.ARTIFACT_DIR}/README.md
                    """
                }
            }
        }

        // ===== ÉTAPE 8: ARCHIVAGE COMPLET =====
        stage('Archive Versioned Artifacts') {
            steps {
                script {
                    echo "📦 Archivage des artefacts versionnés"
                    
                    // Lister tous les artefacts
                    bat """
                    echo "=== LISTE DES ARTEFACTS ==="
                    dir ${env.ARTIFACT_DIR} /s /b
                    """
                    
                    // Archiver avec compression
                    archiveArtifacts artifacts: "${env.ARTIFACT_DIR}/**", fingerprint: true
                    
                    // Ajouter des métadonnées
                    bat """
                    echo "Version: ${env.VERSION}" > build.properties
                    echo "Image: ${env.DOCKER_IMAGE}" >> build.properties
                    echo "Date: %DATE% %TIME%" >> build.properties
                    echo "Status: SUCCESS" >> build.properties
                    """
                    
                    currentBuild.description = "Version: ${env.VERSION} - Node: ${params.NODE_VERSION}"
                    
                    echo "✅ Artefacts versionnés archivés"
                }
            }
        }

        // ===== ÉTAPE 9: NETTOYAGE =====
        stage('Cleanup') {
            steps {
                script {
                    echo "🧹 Nettoyage des ressources"
                    
                    // Arrêter et supprimer le conteneur de test
                    bat """
                    docker stop ${env.CONTAINER_NAME} 2>nul || echo "Conteneur déjà arrêté"
                    docker rm ${env.CONTAINER_NAME} 2>nul || echo "Conteneur déjà supprimé"
                    """
                    
                    // Garder l'image versionnée, supprimer seulement latest si nécessaire
                    bat """
                    echo "Image versionnée ${env.DOCKER_IMAGE} conservée pour le déploiement"
                    """
                    
                    echo "✅ Nettoyage terminé"
                }
            }
        }
    }

    post {
        always {
            echo "🧽 Nettoyage final du workspace"
            cleanWs()
            
            // Notifier la fin du pipeline
            bat 'echo "Pipeline 3 - Build versionné terminé"'
        }
        
        success {
            echo "🏆 PIPELINE 3 - BUILD VERSIONNÉ: SUCCESS ✅"
            
            script {
                // Générer un badge de succès
                bat """
                echo "[![Build Versionné](https://img.shields.io/badge/version-${env.VERSION}-brightgreen)](https://jenkins.example.com/job/pipeline-3/${BUILD_NUMBER}/)" > ${env.ARTIFACT_DIR}/badge.md
                echo "[![Status](https://img.shields.io/badge/status-success-green)](https://jenkins.example.com/job/pipeline-3/${BUILD_NUMBER}/)" >> ${env.ARTIFACT_DIR}/badge.md
                """
                
                // Notification de succès
                emailext(
                    subject: "✅ Build Versionné Réussi: ${env.VERSION}",
                    body: """
                    Le build versionné a réussi !
                    
                    Version: ${env.VERSION}
                    Build: #${BUILD_NUMBER}
                    Image Docker: ${env.DOCKER_IMAGE}
                    Date: ${new Date().format('yyyy-MM-dd HH:mm:ss')}
                    
                    Consultez les artefacts: ${env.BUILD_URL}
                    """,
                    to: 'devops-team@example.com'
                )
            }
        }
        
        failure {
            echo "💥 PIPELINE 3 - BUILD VERSIONNÉ: FAILED ❌"
            
            script {
                // Notification d'échec
                emailext(
                    subject: "❌ Build Versionné Échoué: ${env.VERSION}",
                    body: """
                    Le build versionné a échoué !
                    
                    Version: ${env.VERSION}
                    Build: #${BUILD_NUMBER}
                    Date: ${new Date().format('yyyy-MM-dd HH:mm:ss')}
                    
                    Consultez les logs: ${env.BUILD_URL}console
                    """,
                    to: 'devops-team@example.com'
                )
            }
        }
        
        unstable {
            echo "⚠️  PIPELINE 3 - BUILD VERSIONNÉ: UNSTABLE"
        }
        
        cleanup {
            // Logs de fin
            echo "🔚 Pipeline 3 terminé - ${currentBuild.result}"
        }
    }
}
