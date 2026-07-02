pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    DOCKER_IMAGE = 'cicd-tasklist-frontend'
    DOCKERHUB_NAMESPACE = 'your-dockerhub-namespace'
    FULL_IMAGE_NAME = "${DOCKERHUB_NAMESPACE}/${DOCKER_IMAGE}"
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
                -Dsonar.testExecutionReportPaths=reports/junit.xml \
                -Dsonar.login=$SONAR_TOKEN
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
        sh 'docker build -t ${FULL_IMAGE_NAME}:${BUILD_NUMBER} .'
      }
    }

    stage('Scan Trivy') {
      steps {
        sh '''
          docker run --rm \
            -v /var/run/docker.sock:/var/run/docker.sock \
            aquasec/trivy:latest image \
            --severity HIGH,CRITICAL \
            --exit-code 1 \
            ${FULL_IMAGE_NAME}:${BUILD_NUMBER}
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
            ${FULL_IMAGE_NAME}:${BUILD_NUMBER} \
            -o spdx-json=/workspace/sbom-spdx.json
        '''
      }
    }

    stage('Push Docker Hub') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKERHUB_USERNAME', passwordVariable: 'DOCKERHUB_PASSWORD')]) {
          sh '''
            echo "$DOCKERHUB_PASSWORD" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
            docker push ${FULL_IMAGE_NAME}:${BUILD_NUMBER}
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