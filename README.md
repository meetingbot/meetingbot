<a id="readme-top"></a>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/meetingbot/meetingbot">
    <img src="https://raw.githubusercontent.com/meetingbot/meetingbot/refs/heads/main/src/landing-page/public/logo.svg" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">MeetingBot</h3>

  <p align="center">
    API for sending bots to video meetings while keeping data private & costs low
    <br />
    <a href="https://discord.gg/3q37XYUEnK">Community Discord</a>
    &middot;
    <a href="https://meetingbot.tech">Landing Page</a>
    &middot;
    <a href="https://github.com/meetingbot/meetingbot/issues/new?labels=bug&template=bug_report.md">Report Issue</a>
  </p>
  
  [![Contributors][contributors-shield]][contributors-url]
  [![Forks][forks-shield]][forks-url]
  [![Stargazers][stars-shield]][stars-url]
  [![Issues][issues-shield]][issues-url]
  [![MIT License][license-shield]][license-url]
    
</div>

## Hosted Meeting Bot API

If you’re looking for a hosted meeting bot API, consider checking out [Recall.ai](https://www.recall.ai/?utm_source=github&utm_medium=sponsorship&utm_campaign=meetingbottech), an API for meeting recording.

## Demo

https://github.com/user-attachments/assets/0e2f2673-a59f-4473-a5ed-e2a5e1cd1cac

## Table of Contents
<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#built-with">Built With</a></li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#contributors">Contributors</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

MeetingBot is an open-source meeting bot API.

Meetingbot provides the infrastructure for sending bots to meetings (Google Meet, Microsoft Teams, and Zoom) and recording them, so that developers can build applications that use meeting recording data in just a few lines of code.

All infrastructure is defined using Terraform and deployed to AWS, so that you can easily self host MeetingBot to keep your data private & costs low.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Built With

![architecture](https://github.com/user-attachments/assets/1c5edea5-8308-4155-b6dc-e022620111a9)

- [Next.js](https://nextjs.org/) - Frontend Framework
- [Express](https://expressjs.com/) - Backend Framework
- [tRPC](https://trpc.io/) - End-to-end typesafe API layer
- [Drizzle ORM](https://orm.drizzle.team/) - Typesafe SQL query builder and schema definition
- [PostgreSQL](https://www.postgresql.org/) - Relational Database
- [Terraform](https://www.terraform.io/) - Infrastructure as Code
- [AWS](https://aws.amazon.com/) - Cloud Provider
- [Docker](https://www.docker.com/) - Containerization
- [pnpm](https://pnpm.io/) - Package Manager
- [GitHub Actions](https://github.com/features/actions) - CI/CD

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

<div align="center">
  <a href="https://x.com/owengretzinger/status/1909450692999209465">
    <img src="https://github.com/user-attachments/assets/b14affae-b567-48cc-ac1d-0cdc610b1a3d" alt="Project Demo">
    <p>Self Hosting Guide</p>
  </a>
</div>

To get started with MeetingBot, you'll need to set up the infrastructure and configure the different components.

### Prerequisites

- [AWS Account](https://aws.amazon.com/)
- [Terraform](https://www.terraform.io/downloads.html)
- [Node.js](https://nodejs.org/) (>=18.0.0)
- [pnpm](https://pnpm.io/) (>=8.0.0)
- [Docker](https://www.docker.com/) (for building bot images)
- [AWS CLI](https://aws.amazon.com/cli/)

Important:

- A domain name in Route 53
- An S3 bucket to store Terraform state
- (Optional) A DynamoDB table to lock Terraform state
- A Github App to use for dashboard authentication
  - (Optional) Scope the app to your organization to restrict access

### Installation

See more information in the [Terraform README](src/terraform/README.md).

1.  **Clone the repository**

    ```sh
    git clone https://github.com/meetingbot/meetingbot.git
    cd meetingbot
    ```

2.  **Set up AWS credentials**

    ```sh
    # either login with AWS or run this make command
    make sso
    # This configures the AWS SSO profile named 'meetingbot'
    ```

3.  **Initialize Terraform**

    ```sh
    cp backend.tfvars.example backend.tfvars
    ```

    ```sh
    cp terraform.tfvars.example terraform.tfvars
    ```

    ```sh
    # Modify the .tfvars files with your specific configuration values
    make init
    ```

4.  **Select a Terraform workspace (environment)**

    ```sh
    terraform workspace select dev # or create with: terraform workspace new dev
    ```

5.  **Deploy the infrastructure**

    ```sh
    terraform apply
    ```

6.  **Configure Environment Variables**

    Copy `.env.example` to `.env` in the `src/frontend`, `src/backend`, and `src/bots` directories. Refer to the specific `README` in each directory for more information.

7.  **Install dependencies in each directory:**

    ```bash
    cd src/frontend && pnpm install
    cd src/backend && pnpm install
    cd src/bots && pnpm install
    ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

## Usage

1.  **Deploy the Terraform Infrastructure:** Follow the instructions in the [Terraform README](src/terraform/README.md) to deploy the necessary AWS resources.

2.  **Run the Backend:** Navigate to the `src/backend` directory and start the server using `pnpm dev`. Access the API documentation at `http://localhost:{env.PORT}/docs` (or the deployed endpoint).

3.  **Run the Frontend:** Navigate to the `src/frontend` directory and start the development server using `pnpm dev`. Access the application at `http://localhost:3000` (or the deployed endpoint).

4.  **Create API Keys:** Use the frontend to create API keys for authenticating your applications with the MeetingBot API.

5.  **Deploy Bots:** Use the API endpoints to deploy bots to your desired meeting platforms.

6.  **Access Recordings:** Use the API endpoints to retrieve meeting recordings and metadata.

See each subdirectory for an additional README with more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->

## Contributors

<!-- We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for more information. -->

<a href="https://github.com/meetingbot/meetingbot/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=meetingbot/meetingbot" alt="contrib.rocks image" />
</a>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->

## License

This project is licensed under the GNU Lesser General Public License - see the [LICENSE](LICENSE) file for details.

In general, this means you can use this code in any way you want, commercially or not, as long as any modifications/forks remain public.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

Community Discord: [https://discord.gg/3q37XYUEnK](https://discord.gg/3q37XYUEnK)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments

- This README was created using [gitreadme.dev](https://gitreadme.dev) — an AI tool that looks at your entire codebase to instantly generate high-quality README files.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/meetingbot/meetingbot.svg?style=for-the-badge
[contributors-url]: https://github.com/meetingbot/meetingbot/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/meetingbot/meetingbot.svg?style=for-the-badge
[forks-url]: https://github.com/meetingbot/meetingbot/network/members
[stars-shield]: https://img.shields.io/github/stars/meetingbot/meetingbot.svg?style=for-the-badge
[stars-url]: https://github.com/meetingbot/meetingbot/stargazers
[issues-shield]: https://img.shields.io/github/issues/meetingbot/meetingbot.svg?style=for-the-badge
[issues-url]: https://github.com/meetingbot/meetingbot/issues
[license-shield]: https://img.shields.io/github/license/meetingbot/meetingbot.svg?style=for-the-badge
[license-url]: https://github.com/meetingbot/meetingbot/blob/master/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/company/meetingbot/
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Vue.js]: https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D
[Vue-url]: https://vuejs.org/
[Angular.io]: https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white
[Angular-url]: https://angular.io/
[Svelte.dev]: https://img.shields.io/badge/Svelte-4A4A55?style=for-the-badge&logo=svelte&logoColor=FF3E00
[Svelte-url]: https://svelte.dev/
[Laravel.com]: https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white
[Laravel-url]: https://laravel.com
[Bootstrap.com]: https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white
[Bootstrap-url]: https://getbootstrap.com
[JQuery.com]: https://img.shields.io/badge/jQuery-0769AD?style=for-the-badge&logo=jquery&logoColor=white
[JQuery-url]: https://jquery.com
