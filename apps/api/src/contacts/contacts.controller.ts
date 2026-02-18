import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { Response } from 'express'
import { ContactsService } from './contacts.service'
import { ListContactsDto } from './dto/list-contacts.dto'
import { UpdateContactDto } from './dto/update-contact.dto'
import { ManageTagsDto } from './dto/manage-tags.dto'
import { BulkActionDto } from './dto/bulk-action.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, type CurrentUserPayload } from '../common/decorators/current-user.decorator'

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'List contacts with search, filter, and pagination' })
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() dto: ListContactsDto,
  ) {
    return this.contactsService.findAll(user.tenantId, dto)
  }

  @Get('export')
  @ApiOperation({ summary: 'Export contacts as CSV' })
  async exportCsv(
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ) {
    const csv = await this.contactsService.exportCsv(user.tenantId)

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv')
    res.send(csv)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact profile with conversations, tags, flow history' })
  findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.contactsService.findOne(user.tenantId, id)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update contact details' })
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(user.tenantId, id, dto)
  }

  @Post(':id/tags')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add tags to a contact' })
  addTags(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: ManageTagsDto,
  ) {
    return this.contactsService.addTags(user.tenantId, id, dto.tags)
  }

  @Delete(':id/tags')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove tags from a contact' })
  removeTags(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: ManageTagsDto,
  ) {
    return this.contactsService.removeTags(user.tenantId, id, dto.tags)
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Perform bulk actions on contacts' })
  bulkAction(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: BulkActionDto,
  ) {
    return this.contactsService.bulkAction(user.tenantId, dto)
  }
}
