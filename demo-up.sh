#!/usr/bin/env bash
set -e
echo "Starting Moi Forces Academy demo..."
docker-compose up --build -d
echo "Waiting for services to initialize (20s)..."
sleep 20
echo "Admin login: admin@moiforcesacademy.ac.ke / Admin@123"
echo "Parent login: parent@moiforcesacademy.ac.ke / Parent@123"
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:8080"
echo "Postgres: localhost:5432 (user=school, password=schoolpass, db=schooldb)"
echo "To view logs: docker-compose logs -f backend"
echo "Demo started."
