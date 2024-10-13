# Trip report
See task details [here]()
#### [API Documentation](https://app.getpostman.com/join-team?invite_code=7b7e777ac8d060b12d1262a34ab9932c&target_code=d1f75944a75bdfeabf8181efcc4e78ae)

### Security issues

 1. There were some issues with the `JWT secret key` in the `Auth module`.
    - The previous secret key was not strong enough. So I generated a new strong JWT secret. You can use jwt secret generator [like this one](https://jwtsecret.com/generate) or explore other options.
    - It was hardcoded manual in code. To fix, I utilized it as an environment's variable `JWT_SECRETKEY=`.
    - But if you need more security, you should think about to use secret managers such as [Microsoft Azure Key Vault](https://azure.microsoft.com/en-us/products/key-vault), [Cloud KMS](https://cloud.google.com/security/products/security-key-management), or [AWS Secrets Manager](https://cloud.google.com/security/products/secret-manager) etc.

 2. Password issue.
    - We kept row user passwords in the database. It's not safe at all. So i added a new dependency [bcryptjs](https://www.npmjs.com/package/bcryptjs) for hashing passwords. Now, we store hashed passwords in DB, and compare the hashes from DB with the hashed input password during `sign-in`.

### New features implementations
1. Prepare controller `CRUD` in module `project` see [postman API Documentations](https://app.getpostman.com/join-team?invite_code=7b7e777ac8d060b12d1262a34ab9932c&target_code=d1f75944a75bdfeabf8181efcc4e78ae).
   - Create project.
   - Update project.
   - Delete project. The project will not be deleted from the database. Only the project's status will be changed to "deleted".
2. Prepare job that will run every 1 minute and filters projects that has `expiredAt < NOW()` and update status to `expired`.
	- To implement it I use default nest.js module `ScheduleModule`. I created a new `Cron.module` for scheduling jobs. Now, `CronService.markExpiredProjects()` will run every minute to mark each project as expired if it meets the criteria.
   
### Some extra features
1. Implemented API documentation via Postman. You can access it through the [invite link](https://app.getpostman.com/join-team?invite_code=7b7e777ac8d060b12d1262a34ab9932c&target_code=d1f75944a75bdfeabf8181efcc4e78ae).
2. Implemented unit and e2e tests. 
   - Run unit tests by ```npm run test:cov```.
   - Run e2e tests by ```npm run test:e2e```.

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:

- [Docker](https://www.docker.com/products/docker-desktop) (including Docker Compose)
- [Node.js v20](https://nodejs.org/)
- [npm](https://www.npmjs.com/get-npm) (for managing dependencies)
- [Postman account](https://www.postman.com/) (For using api documentations)

___

## Getting Started

### Cloning the Repository

```bash
git clone https://github.com/Daniil-Khlyvniuk/Project-Manager.git
cd Project-Manager
```

### Configuration
Make sure to create a `.env` file in the root directory based on the `.env.tpl` file provided. This file will contain environment-specific variables used by the application.

### Docker Compose Setup
- Build and Start Containers
	 To build and start the containers, use the following command:
```bash
docker compose up -d
```
This command will build the Docker images and start the containers defined in `docker-compose.yml`.

### Run the application
- Install dependencies 
```bash
npm install
```
- Start the server
```bash
npm run start:dev
```

### Accessing the Application
- By default, the server will be accessible at `http://localhost:3000`.
- Mysql will be running on `mysql://root:root@127.0.0.1:3306/app?connection_limit=10&pool_timeout=60`.

## Development
1. Running Tests
	To run the tests, from root directory use:
- unit tests 
```bash
npm run test:cov
```
- 2e2 tests 
```bash
npm run test:e2e
```
2. Update database schema. Use this command when you change `schema.prisma` file.

```bash
npm run prisma:dev:update
```
