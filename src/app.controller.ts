import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Header('Content-Type', 'text/html')
  @ApiOperation({ summary: 'Welcome HTML page' })
  @ApiOkResponse({ description: 'HTML welcome page' })
  @ApiExcludeEndpoint(false)
  welcomePage(): string {
    return this.appService.welcomePage();
  }
}
