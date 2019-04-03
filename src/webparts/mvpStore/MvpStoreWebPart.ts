import { Version } from '@microsoft/sp-core-library';

import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';

import { escape } from '@microsoft/sp-lodash-subset';

import styles from './MvpStoreWebPart.module.scss';
import * as strings from 'MvpStoreWebPartStrings';
import * as jQuery from 'jquery';

import { SPHttpClient, SPHttpClientConfiguration, SPHttpClientResponse, ODataVersion, ISPHttpClientConfiguration } from '@microsoft/sp-http';
import { IODataUser, IODataWeb, IODataListItem } from '@microsoft/sp-odata-types';
import {SPComponentLoader} from '@microsoft/sp-loader'



export interface IMvpStoreWebPartProps {
  // Link1_Hedding: string;
  // Link1_Url: string;
  // Link2_Hedding: string;
  // Link2_Url: string;
  // Link3_Hedding: string;
  // Link3_Url: string;
}

export default class MvpStoreWebPart extends BaseClientSideWebPart<IMvpStoreWebPartProps> {
  
  private _CategoryStr : string = "";
  private _ListItems : string = "";
  
  protected GetUserInfo()
  {
      // Here, 'this' refers to my SPFx webpart which inherits from the BaseClientSideWebPart class.
      // Since I am calling this method from inside the class, I have access to 'this'.

      const spHttpClient: SPHttpClient = this.context.spHttpClient;
      const currentWebUrl: string = this.context.pageContext.web.absoluteUrl;

      //GET current web info
      spHttpClient.get(`${currentWebUrl}/_api/web`, SPHttpClient.configurations.v1).then((response: SPHttpClientResponse) => {

          response.json().then((web: IODataWeb) => {

              //console.log(web.Url);
          });
      });

      //GET current user information from the User Information List
      spHttpClient.get(`${currentWebUrl}/_api/web/currentuser`, SPHttpClient.configurations.v1).then((response: SPHttpClientResponse) => {

          response.json().then((user: IODataUser) => {

              //console.log(user.LoginName);
          });
      });

      //GET current user information from the User Profile Service
      spHttpClient.get(`${currentWebUrl}/_api/SP.UserProfiles.PeopleManager/GetMyProperties`, SPHttpClient.configurations.v1).then((response: SPHttpClientResponse) => {

          response.json().then((userProfileProps: any) => {

              //console.log(userProfileProps);
          });
      });

  }

  protected GetDropDownItems() : Promise<any>
  {
      //GET Target User Group Dropdown Values.
      //https://team.effem.com/sites/digitalmarssolutionstore/_api/web/lists/getbytitle('MVP%20store')/fields/getbytitle('Target%20User%20Group')/Choices

      return new Promise<any>((resolve : (data : any) => void, reject : (error : any) => void) => {
        this.context.spHttpClient.get(`${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('MVP Store')/fields/getbytitle('Function')/Choices`, SPHttpClient.configurations.v1)
        .then((response: SPHttpClientResponse) => {
          return response.json()
        })
        .then((elements: any) => {

          for(let element of elements.value)
          {
            this._CategoryStr = this._CategoryStr + `<li class="cat-item"><a class="MVP_Filter" id="MyFilter" value="${element}">${element}</a></li>`;
          }

          this._CategoryStr = this._CategoryStr + `<li class="cat-item"><a class="MVP_Filter" id="MyFilter" value="All Categories">All Categories</a></li>`;

          resolve(this._CategoryStr);
          return;
        }).catch((error : Error) => {
          reject(error);
          return;
        });
      });                     
  }

  protected GetListItems() : Promise<any>
  {
      //GET Target User Group Dropdown Values.
      //https://team.effem.com/sites/digitalmarssolutionstore/_api/web/lists/getbytitle('MVP%20store')/fields/getbytitle('Target%20User%20Group')/Choices

      return new Promise<any>((resolve : (data : any) => void, reject : (error : any) => void) => {
        this.context.spHttpClient.get(`${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('MVP Store')/items`, SPHttpClient.configurations.v1)
        .then((response: SPHttpClientResponse) => {
          return response.json()
        })
        .then((ListItems: any) => {
          //console.log(ListItems.value);
          
          for(let item in ListItems.value)
          {
              let _ItemURL : string = this.context.pageContext.web.absoluteUrl + `/Lists/MVP%20store/DispForm.aspx?ID=${ListItems.value[item].Id}`;
              let _Category : string = "";
              let _CategoryStr : string = "";

              for(let Group of ListItems.value[item].Target_x0020_User_x0020_Group)
              {
                  _Category = _Category + Group + ", ";
                  _CategoryStr = _CategoryStr + `<a>${Group}</a>, `;
              }

              _Category = _Category.slice(0, -2);
              _CategoryStr = _CategoryStr.slice(0, -2);

              let _ImageURL : string = "";
              if(ListItems.value[item].Images.indexOf('src="') > -1)
              {
                _ImageURL = this.context.pageContext.web.absoluteUrl + '/SiteAssets/' + ListItems.value[item].Images.split('src="')[1].split('"')[0].split('SiteAssets/')[1];
              }
              
              this._ListItems = this._ListItems + `
              <div id='post-${ListItems.value[item].Id}' class='${styles.post} MainItems' GroupTags='${_Category}'>
                <div class='${styles["post-image"]}'>
                    <a title='${ListItems.value[item].Title}' href='${_ItemURL}'>
                        <img src='${_ImageURL}' alt=''>
                    </a>
                </div>
                <div class='post-header1'>
                  <p class='${styles["post-categories"]}'>${_CategoryStr}</p>
                  <h2 class='${styles["post-title"]}'>
                    <a href='${_ItemURL}'>${ListItems.value[item].Title}</a>
                  </h2>
                </div>
              </div>`
          }
          resolve(this._ListItems);
          return;
        }).catch((error : Error) => {
          reject(error);
          return;
        });
      });                     
  }

  protected BindFinalHTML()
  {
      this.domElement.innerHTML = `
      <div class="${styles.TopDiv}">
        <main id="main" class="${styles.content}">
          <header class="page-title clear-fix"><h4 id="Category_Hedder">Category: All</h4>
            <p id="Number_Of_Posts">All Posts</p>
          </header>
          
          <br/>

          <div class="${styles.post_Holder}">
          ${this._ListItems}
          </div>
        </main>

        <div class="${styles.sidebar}">
          <aside id="categories-3" class="widget widget_categories">
            <div class="widget-content">
              <h3 class="widget-title">Categories</h3>
              <ul>${this._CategoryStr}</ul>
            </div>
            <div class="clear"></div>
          </aside>

          <aside id="pages-3" class="widget widget_pages" style="display:none;">
              
          </aside>
        </div><div class="clear"></div>
      </div>`;

      var slides = document.getElementsByClassName("MVP_Filter");
      for(var i = 0; i < slides.length; i++)
      {
        document.getElementsByClassName('MVP_Filter')[i].addEventListener("click", this.onClickHandler);
      }
  }

  public render(): void {

    //this.ObservSearch();

    if(!this.renderedOnce)
    {
      SPComponentLoader.loadCss('https://s0.wp.com/_static/??-eJyNj9EKwjAMRX/IGqZzPonf0tWsRtNmrCnFv7djCA5h+JbDvedCoIzGSVSMCnrHgAnG3MMkhSl6GGpkbMEkAVewdyntYFtO+uLfYshm5OwpJih086gJMNdUnoSGbQHFMLLVOvb3QBJHlg3VyhoWmSCKLuHn2Fr1KIbFWSWJKzADW5q21Al7Fu/n72vrC2fpGi7N6XDujm3Tdo83ehCN6g==?cssminify=yes');

      this.GetDropDownItems().then(() => {
        this.GetListItems().then(() => {
          this.BindFinalHTML();
        });
      });
    }
  }

  private ObservSearch()
  {
    debugger;
    var vlist = document.getElementsByClassName('ms-compositeHeader-searchBoxContainer')[0];
    
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          if(vlist.innerHTML.indexOf('<input ') > -1)
          {
            var SerachBox =jQuery("div[class*='searchBox_']");
            SerachBox.css({'position': 'absolute', 'bottom': '0', 'left': '0', 'right': '0', 'margin':'auto'});
            var inputBox = SerachBox.find('input');
            inputBox.css({'font-size': 'xx-large'});
            // SerachBox.setAttribute("style", "position: absolute; bottom: 0; left: 0; right: 0; margin: auto;");
          }
        }
      });
    });
  
   
    observer.observe(vlist, {
      attributes: true,
      childList: true,
      characterData: true
     });
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                // PropertyPaneTextField('Link1_Hedding', {
                //   label: 'Link 1 Title'
                // }),
                // PropertyPaneTextField('Link1_Url', {
                //   label: 'Link 1 Url'
                // }),
                // PropertyPaneTextField('Link2_Hedding', {
                //   label: 'Link 2 Title'
                // }),
                // PropertyPaneTextField('Link2_Url', {
                //   label: 'Link 2 Url'
                // }),
                // PropertyPaneTextField('Link3_Hedding', {
                //   label: 'Link 3 Title'
                // }),
                // PropertyPaneTextField('Link3_Url', {
                //   label: 'Link 3 Url'
                // })                
              ]
            }
          ]
        }
      ]
    };
  }

  protected onClickHandler(e)
  {
    debugger; ``
    var _FilterNameStr : string = e.currentTarget.getAttribute("value");//innerHTML;
    var NumberOfItems : number = 0;
    var slides = document.getElementsByClassName("MainItems");

    if(_FilterNameStr === "All Categories")
    {
      for(var i = 0; i < slides.length; i++)
      {
        document.getElementsByClassName('MainItems')[i].setAttribute("style", "display: block;");
      }
      document.getElementById("Number_Of_Posts").innerHTML = "All Posts";
      document.getElementById("Category_Hedder").innerHTML = "CATEGORY: All";
    }
    else
    {

      for(var i = 0; i < slides.length; i++)
      {
        var mainItemCatagory:string = document.getElementsByClassName('MainItems')[i].getAttribute("GroupTags");
        if(mainItemCatagory.indexOf(_FilterNameStr) === -1)
        {
          document.getElementsByClassName('MainItems')[i].setAttribute("style", "display: none;");
        }
        else
        {
          document.getElementsByClassName('MainItems')[i].setAttribute("style", "display: block;");
          NumberOfItems++;
        }
      }

      document.getElementById("Number_Of_Posts").innerHTML = NumberOfItems + " Posts";
      document.getElementById("Category_Hedder").innerHTML = "CATEGORY: " + _FilterNameStr;
    }
  }
}

/*
<div class="widget-content"><h3 class="widget-title">Useful info</h3><ul><li class="page_item page-item-35"><a href="${escape(this.properties.Link1_Url)}">${escape(this.properties.Link1_Hedding)}</a></li><li class="page_item page-item-51"><a href="${escape(this.properties.Link2_Url)}">${escape(this.properties.Link2_Hedding)}</a></li><li class="page_item page-item-30"><a href="${escape(this.properties.Link3_Url)}">${escape(this.properties.Link3_Hedding)}</a></li></ul></div><div class="clear"></div>
*/