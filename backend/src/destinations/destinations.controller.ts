import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DestinationsService } from './destinations.service';

/**
 * Public — these pages exist to be found by search engines and shared, so no
 * auth. They serve only what the listing pages already serve publicly.
 */
@ApiTags('Destinations')
@Controller('destinations')
export class DestinationsController {
  constructor(private readonly service: DestinationsService) {}

  @Get()
  @ApiOperation({ summary: 'Every city and country that has published listings' })
  async list() {
    return this.service.listDestinations();
  }

  /**
   * Must stay ABOVE @Get(':city') — Nest matches in declaration order, and a
   * static segment declared after a param route is never reached.
   */
  @Get('country/:country')
  @ApiOperation({ summary: 'Top rated, most reviewed and trending in a country' })
  async byCountry(@Param('country') country: string) {
    return this.service.getDestination('country', country);
  }

  @Get(':city')
  @ApiOperation({ summary: 'Top rated, most reviewed and trending in a city' })
  async byCity(@Param('city') city: string) {
    return this.service.getDestination('city', city);
  }
}
