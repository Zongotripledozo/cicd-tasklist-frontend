pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    APP_IMAGE_NAME = 'cicd-tasklist-frontend'
    LOCAL_IMAGE_NAME = "${APP_IMAGE_NAME}:${env.BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('npm ci') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Tests unitaires') {
      steps {
        sh 'npm run test:coverage'
      }
      post {
        always {
          junit 'reports/junit.xml'
        }
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Analyse SonarQube') {
      steps {
        withSonarQubeEnv('sonarqube-local') {
          withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
            sh '''
              npx sonar-scanner \
                -Dsonar.projectKey=cicd-tasklist-frontend \
                -Dsonar.projectName=cicd-tasklist-frontend \
                -Dsonar.sources=src \
                -Dsonar.tests=src/__tests__ \
                -Dsonar.exclusions=src/__tests__/** \
                -Dsonar.coverage.exclusions=src/__tests__/** \
                -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                -Dsonar.token=$SONAR_TOKEN
            '''
          }
        }
      }
    }

    stage('Quality Gate') {
      steps {
        timeout(time: 10, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

    stage('Build image Docker') {
      steps {
        sh 'docker build -t $LOCAL_IMAGE_NAME .'
      }
    }

    stage('Scan Trivy') {
      steps {
        sh '''
          docker run --rm \
            -v /var/run/docker.sock:/var/run/docker.sock \
            -v trivy-cache:/root/.cache/ \
            aquasec/trivy:latest image \
            --timeout 20m \
            --severity HIGH,CRITICAL \
            --exit-code 1 \
            $LOCAL_IMAGE_NAME
        '''
      }
    }

    stage('Generate SBOM SPDX') {
      steps {
        sh '''
          docker run --rm \
            -v /var/run/docker.sock:/var/run/docker.sock \
            -v "$WORKSPACE:/workspace" \
            anchore/syft:latest \
            $LOCAL_IMAGE_NAME \
            -o spdx-json=/workspace/sbom-spdx.json
        '''
      }
    }

    stage('Push Docker Hub') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKERHUB_USERNAME', passwordVariable: 'DOCKERHUB_PASSWORD')]) {
          sh '''
            echo "$DOCKERHUB_PASSWORD" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
            REMOTE_IMAGE_NAME="docker.io/$DOCKERHUB_USERNAME/cicd-tasklist-frontend:$BUILD_NUMBER"
            docker tag "$LOCAL_IMAGE_NAME" "$REMOTE_IMAGE_NAME"
            docker push "$REMOTE_IMAGE_NAME"
          '''
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'sbom-spdx.json', allowEmptyArchive: true, fingerprint: true
    }
  }
}